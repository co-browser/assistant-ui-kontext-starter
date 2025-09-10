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

  // Context personalization is enabled only when a Kontext userId cookie is present

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
        const c = lastUser?.content as unknown;
        if (typeof c === "string") {
          userQuery = c;
        } else if (Array.isArray(c)) {
          type TextPart = { type?: string; text?: string; content?: string } | string;
          const isTextPart = (obj: unknown): obj is { type: string; text: string } => {
            if (typeof obj !== "object" || obj === null) return false;
            const rec = obj as Record<string, unknown>;
            return rec.type === "text" && typeof rec.text === "string";
          };
          const hasContent = (obj: unknown): obj is { content: string } => {
            if (typeof obj !== "object" || obj === null) return false;
            const rec = obj as Record<string, unknown>;
            return typeof rec.content === "string";
          };
          userQuery = c
            .map((part: TextPart) => {
              if (typeof part === "string") return part;
              if (isTextPart(part)) return part.text;
              if (hasContent(part)) return part.content;
              return "";
            })
            .join(" ")
            .trim() || undefined;
        }
      } catch {}

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
        } catch {
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms before retry
          } else {
            // Try a final fallback: request without userQuery (may hit cache on server)
            try {
              context = await persona.getContext({
                userId,
                task: 'chat',
                maxTokens: 600,
                privacyLevel: 'none',
              });
              fallbackMode = 'retry-no-userQuery';
            } catch {
              throw new Error('Kontext context fetch failed');
            }
          }
        }
      }

      // Augment system prompt with clear behavioral instructions to avoid generic greetings
      const basePrompt = context?.systemPrompt || "";
      const instruction = `You are a personalized assistant. Always answer the user's last message directly and concisely. Use any turn-specific context provided by the server and persona facts to include specific names, projects, numbers, or dates when relevant. Avoid generic greetings; respond with the requested information first.`;
      systemPrompt = `${instruction}\n\n${basePrompt}`.trim();
      // Detect an actual injected turn context section (avoid false positives from our instruction wording)
      hasTurnContext =
        !!systemPrompt && /(^|\n)Context for this turn:/i.test(systemPrompt);

      // Cache the successful system prompt for brief reuse (e.g., 10 minutes)
      if (systemPrompt) {
        SYSTEM_PROMPT_CACHE.set(userId, { prompt: systemPrompt, at: Date.now() });
      }
    } catch {
      // Continue without personalization if Kontext fails
      // Swallow error details; rely on cached prompt if present
      // Use a cached prompt if available and fresh (<= 10 minutes)
      const cached = SYSTEM_PROMPT_CACHE.get(userId);
      const tenMinutes = 10 * 60 * 1000;
      if (cached && Date.now() - cached.at <= tenMinutes) {
        systemPrompt = cached.prompt;
        cacheHit = true;
        fallbackMode = fallbackMode === 'none' ? 'cached' : fallbackMode;
      }
    }
  } else {
  }

  // Optionally prepend system message with Kontext context

  if (systemPrompt) {
    // Prepend Kontext context as a system message
    modelMessages.unshift({
      role: "system",
      content: systemPrompt,
    });
  } else {
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
