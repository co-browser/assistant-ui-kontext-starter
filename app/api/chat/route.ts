import { openai } from "@ai-sdk/openai";
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  CoreMessage,
} from "ai";
import { Persona } from '@kontext.dev/kontext-sdk';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  
  // Get userId from cookie for Kontext personalization
  const cookieStore = await cookies();
  const userId = cookieStore.get('kontext_user_id')?.value;
  
  let systemPrompt: string | undefined;
  
  // Fetch personalized context if user is connected
  if (userId) {
    try {
      const persona = new Persona({ 
        apiKey: process.env.KONTEXT_API_KEY!,
      });
      
      const context = await persona.getContext({
        userId,
        task: 'chat',
        maxTokens: 500, // Limit context size to manage token usage
        privacyLevel: 'moderate', // Balanced privacy setting
      });
      
      systemPrompt = context.systemPrompt;
    } catch (error: any) {
      // Continue without personalization if Kontext fails
      console.error('Kontext context fetch failed:', error.message);
    }
  }
  
  // Convert messages and optionally prepend system message with Kontext context
  const modelMessages: CoreMessage[] = convertToModelMessages(messages);
  
  if (systemPrompt) {
    // Prepend Kontext context as a system message
    modelMessages.unshift({
      role: 'system',
      content: systemPrompt,
    });
  }
  
  const result = streamText({
    model: openai("gpt-4o"),
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
