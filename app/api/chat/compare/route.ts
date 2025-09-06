import { cookies } from 'next/headers';
import { Persona } from '@kontext.dev/kontext-sdk';
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, CoreMessage, UIMessage, streamText } from 'ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages: UIMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    const explicitUserQuery: string | undefined = typeof body?.userQuery === 'string' ? body.userQuery : undefined;
    const cookieStore = await cookies();
    const userId = cookieStore.get('kontext_user_id')?.value;
    if (!userId) {
      return Response.json({ error: 'User not connected' }, { status: 401 });
    }

    const persona = process.env.KONTEXT_API_URL
      ? new Persona({ apiKey: process.env.KONTEXT_API_KEY!, apiUrl: process.env.KONTEXT_API_URL })
      : new Persona({ apiKey: process.env.KONTEXT_API_KEY! });

    // Extract the latest user message as userQuery
    let userQuery: string | undefined = explicitUserQuery;
    if (!userQuery) {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      const content: any = lastUser?.content as any;
      if (typeof content === 'string') {
        userQuery = content;
      } else if (Array.isArray(content)) {
        userQuery = content.map((c: any) => c?.text || c?.content || '').join(' ').trim() || undefined;
      }
    }

    // Fetch contexts in parallel
    const [ctxWith, ctxWithout] = await Promise.all([
      persona.getContext({ userId, task: 'chat', userQuery, maxTokens: 600, privacyLevel: 'none' }),
      persona.getContext({ userId, task: 'chat', maxTokens: 600, privacyLevel: 'none' }),
    ]);

    let baseModelMessages: CoreMessage[] = [];
    try {
      baseModelMessages = convertToModelMessages(messages);
    } catch {
      // Fallback to constructing from explicit userQuery if provided
      if (explicitUserQuery) {
        baseModelMessages = [
          { role: 'user', content: [{ type: 'text', text: explicitUserQuery }] as any },
        ];
      } else {
        baseModelMessages = [];
      }
    }

    // Prepare message arrays with an instruction wrapper to reduce generic greetings
    const instruction = `You are a personalized assistant. Always answer the user's last message directly and concisely. Use any turn-specific context provided by the server and persona facts to include specific names, projects, numbers, or dates when relevant. Avoid generic greetings; respond with the requested information first.`;
    const withSystem = `${instruction}\n\n${ctxWith.systemPrompt}`.trim();
    const withoutSystem = `${instruction}\n\n${ctxWithout.systemPrompt}`.trim();
    const withMessages: CoreMessage[] = [
      { role: 'system', content: withSystem },
      ...baseModelMessages,
    ];
    const withoutMessages: CoreMessage[] = [
      { role: 'system', content: withoutSystem },
      ...baseModelMessages,
    ];

    // Generate both responses in parallel (non-streamed aggregation)
    const model = openai('gpt-4o');
    const [withStream, withoutStream] = await Promise.all([
      streamText({ model, messages: withMessages }),
      streamText({ model, messages: withoutMessages }),
    ]);

    const read = async (rs: ReadableStream<string>) => {
      const reader = rs.getReader();
      let out = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        out += value ?? '';
      }
      return out;
    };

    const [withText, withoutText] = await Promise.all([
      read(withStream.textStream),
      read(withoutStream.textStream),
    ]);

    // Try to extract a turn-specific section for visibility
    const extractTurnSnippet = (sp: string | undefined) => {
      if (!sp) return null;
      const idx = sp.search(/(^|\n)Context for this turn:/i);
      if (idx === -1) return null;
      return sp.slice(idx, idx + 600);
    };

    return Response.json({
      meta: {
        userQueryPreview: userQuery?.slice(0, 160) || null,
        model: 'gpt-4o',
      },
      withUserQuery: {
        systemPromptPreview: ctxWith.systemPrompt.slice(0, 400),
        turnContextPreview: extractTurnSnippet(ctxWith.systemPrompt),
        response: withText,
      },
      withoutUserQuery: {
        systemPromptPreview: ctxWithout.systemPrompt.slice(0, 400),
        turnContextPreview: extractTurnSnippet(ctxWithout.systemPrompt),
        response: withoutText,
      },
    });
  } catch (e: any) {
    const message = e?.message || 'Server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
