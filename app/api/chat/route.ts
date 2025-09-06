import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages, CoreMessage } from "ai";
import { Persona } from "@kontext.dev/kontext-sdk";
import { cookies } from "next/headers";

// Simple in-memory cache of the last successful system prompt per user.
// Helps survive transient CONTEXT_FAILED errors from the Kontext API without forcing reconnects.
const SYSTEM_PROMPT_CACHE = new Map<string, { prompt: string; at: number }>();

export async function POST(req: Request) {
  const body = await req.json();
  const messages: UIMessage[] = body.messages;
  // Convert messages up-front to reliably extract userQuery text
  const modelMessages: CoreMessage[] = convertToModelMessages(messages);

  // Get userId from cookie for Kontext personalization
  const cookieStore = await cookies();
  const userId = cookieStore.get("kontext_user_id")?.value;
  const useUserQueryCookie = cookieStore.get("kontext_use_user_query")?.value;
  const useUserQuery: boolean = useUserQueryCookie
    ? useUserQueryCookie === "1"
    : body.useUserQuery !== false; // default true unless explicitly disabled

  console.log("[Kontext Debug] Cookie userId:", userId);

  let systemPrompt: string | undefined;
  let hasTurnContext = false;
  let cacheHit = false;
  let fallbackMode: 'none' | 'cached' | 'retry-no-userQuery' = 'none';

  // Fetch personalized context if user is connected
  if (userId) {
    try {
      const persona = process.env.KONTEXT_API_URL
        ? new Persona({ apiKey: process.env.KONTEXT_API_KEY!, apiUrl: process.env.KONTEXT_API_URL })
        : new Persona({ apiKey: process.env.KONTEXT_API_KEY! });

      console.log("[Kontext Debug] Fetching context for userId:", userId);

      // Add retry logic for better reliability
      let attempts = 0;
      const maxAttempts = 2;
      let context;
      // Extract latest user message for per-turn focus from converted CoreMessages
      let userQuery: string | undefined;
      try {
        const lastUser = [...modelMessages]
          .reverse()
          .find((m) => m.role === "user");
        const c: any = lastUser?.content as any;
        if (typeof c === "string") {
          userQuery = c;
        } else if (Array.isArray(c)) {
          userQuery =
            c
              .map((part: any) => {
                if (part?.type === "text" && typeof part?.text === "string")
                  return part.text;
                if (typeof part === "string") return part;
                if (part?.content && typeof part.content === "string")
                  return part.content;
                return "";
              })
              .join(" ")
              .trim() || undefined;
        }
      } catch (_) {}

      while (attempts < maxAttempts) {
        try {
          context = await persona.getContext({
            userId,
            task: "chat",
            userQuery: useUserQuery ? userQuery : undefined,
            maxTokens: 600,
            privacyLevel: "none",
          });

          if (context?.systemPrompt) {
            break; // Success, exit retry loop
          }
        } catch (retryError: any) {
          attempts++;
          console.log(`[Kontext Debug] Attempt ${attempts} failed:`, {
            message: retryError?.message,
            code: retryError?.code || retryError?.name,
            status: retryError?.status || retryError?.response?.status,
          });
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms before retry
          } else {
            // Try a final fallback: request without userQuery (may hit cache on server)
            try {
              console.log('[Kontext Debug] Final fallback: retry without userQuery');
              context = await persona.getContext({
                userId,
                task: 'chat',
                maxTokens: 600,
                privacyLevel: 'none',
              });
              fallbackMode = 'retry-no-userQuery';
            } catch (finalErr: any) {
              throw finalErr;
            }
          }
        }
      }

      // Augment system prompt with clear behavioral instructions to avoid generic greetings
      const basePrompt = context?.systemPrompt || "";
      const instruction = `You are a personalized assistant. Always answer the user's last message directly and concisely. Use any turn-specific context provided by the server and persona facts to include specific names, projects, numbers, or dates when relevant. Avoid generic greetings; respond with the requested information first.`;
      systemPrompt = `${instruction}\n\n${basePrompt}`.trim();
      console.log(
        "[Kontext Debug] System prompt received:",
        systemPrompt ? "Yes" : "No"
      );
      console.log(
        "[Kontext Debug] System prompt preview:",
        systemPrompt?.substring(0, 200)
      );
      console.log(
        "[Kontext Debug] userQuery used:",
        useUserQuery,
        "| preview:",
        typeof userQuery === "string" ? userQuery.substring(0, 120) : "n/a"
      );

      // Additional validation
      if (systemPrompt && systemPrompt.includes("Michel Osswald")) {
        console.log(
          "[Kontext Debug] Identity context confirmed: Michel Osswald found in prompt"
        );
      }
      // Detect an actual injected turn context section (avoid false positives from our instruction wording)
      hasTurnContext =
        !!systemPrompt && /(^|\n)Context for this turn:/i.test(systemPrompt);
      console.log("[Kontext Debug] hasTurnContext:", hasTurnContext);

      // Cache the successful system prompt for brief reuse (e.g., 10 minutes)
      if (systemPrompt) {
        SYSTEM_PROMPT_CACHE.set(userId, { prompt: systemPrompt, at: Date.now() });
      }
    } catch (error: any) {
      // Continue without personalization if Kontext fails
      const code = error?.code || error?.name;
      const status = error?.status || error?.response?.status;
      console.error('[Kontext Debug] Context fetch failed after retries:', { message: error?.message, code, status });
      // Use a cached prompt if available and fresh (<= 10 minutes)
      const cached = SYSTEM_PROMPT_CACHE.get(userId);
      const tenMinutes = 10 * 60 * 1000;
      if (cached && Date.now() - cached.at <= tenMinutes) {
        systemPrompt = cached.prompt;
        cacheHit = true;
        fallbackMode = fallbackMode === 'none' ? 'cached' : fallbackMode;
        console.log('[Kontext Debug] Using cached system prompt');
      }
    }
  } else {
    console.log("[Kontext Debug] No userId in cookie");
  }

  // Optionally prepend system message with Kontext context

  if (systemPrompt) {
    // Prepend Kontext context as a system message
    modelMessages.unshift({
      role: "system",
      content: systemPrompt,
    });
    console.log("[Kontext Debug] System message added to model messages");
    console.log("[Kontext Debug] Total messages:", modelMessages.length);
    console.log("[Kontext Debug] First message role:", modelMessages[0]?.role);
  } else {
    console.log("[Kontext Debug] No system prompt to add");
  }

  const result = streamText({
    model: openai("gpt-4o"),
    messages: modelMessages,
  });

  // Attach debug headers so you can verify behavior from the client/devtools
  return result.toUIMessageStreamResponse({
    headers: {
      "X-Kontext-UserQuery": useUserQuery ? "1" : "0",
      "X-Kontext-TurnContext": hasTurnContext ? "1" : "0",
      "X-Kontext-Cache": cacheHit ? 'hit' : 'miss',
      "X-Kontext-Fallback": fallbackMode,
    },
  });
}
