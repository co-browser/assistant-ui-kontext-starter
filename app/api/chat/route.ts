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
  
  console.log('[Kontext Debug] Cookie userId:', userId);
  
  let systemPrompt: string | undefined;
  
  // Fetch personalized context if user is connected
  if (userId) {
    try {
      const persona = new Persona({ 
        apiKey: process.env.KONTEXT_API_KEY!,
      });
      
      console.log('[Kontext Debug] Fetching context for userId:', userId);
      
      // Add retry logic for better reliability
      let attempts = 0;
      const maxAttempts = 2;
      let context;
      
      while (attempts < maxAttempts) {
        try {
          context = await persona.getContext({
            userId,
            task: 'chat',
            maxTokens: 1000, // Increased for more complete context
            privacyLevel: 'none', // Full context access for identity recognition
            cachePolicy: 'fresh', // Ensure fresh data
            includeRecentData: true, // Include recent data for better context
          });
          
          if (context?.systemPrompt) {
            break; // Success, exit retry loop
          }
        } catch (retryError: any) {
          attempts++;
          console.log(`[Kontext Debug] Attempt ${attempts} failed:`, retryError.message);
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
          } else {
            throw retryError;
          }
        }
      }
      
      systemPrompt = context?.systemPrompt;
      console.log('[Kontext Debug] System prompt received:', systemPrompt ? 'Yes' : 'No');
      console.log('[Kontext Debug] System prompt preview:', systemPrompt?.substring(0, 200));
      
      // Additional validation
      if (systemPrompt && systemPrompt.includes('Michel Osswald')) {
        console.log('[Kontext Debug] Identity context confirmed: Michel Osswald found in prompt');
      }
    } catch (error: any) {
      // Continue without personalization if Kontext fails
      console.error('[Kontext Debug] Context fetch failed after retries:', error.message);
    }
  } else {
    console.log('[Kontext Debug] No userId in cookie');
  }
  
  // Convert messages and optionally prepend system message with Kontext context
  const modelMessages: CoreMessage[] = convertToModelMessages(messages);
  
  if (systemPrompt) {
    // Prepend Kontext context as a system message
    modelMessages.unshift({
      role: 'system',
      content: systemPrompt,
    });
    console.log('[Kontext Debug] System message added to model messages');
    console.log('[Kontext Debug] Total messages:', modelMessages.length);
    console.log('[Kontext Debug] First message role:', modelMessages[0]?.role);
  } else {
    console.log('[Kontext Debug] No system prompt to add');
  }
  
  const result = streamText({
    model: openai("gpt-4o"),
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
