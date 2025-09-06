# assistant-ui + Kontext SDK Starter

Production-ready AI chatbot with personalized responses powered by [assistant-ui](https://www.assistant-ui.com) and [Kontext SDK](https://kontext.dev).

## Features

- Beautiful UI built with assistant-ui composable primitives and shadcn/ui
- Personalized AI responses tailored to each user via Gmail context
- Production-ready with streaming, auto-scroll, and error handling
- Privacy-first design with user-controlled data and one-click disconnect
- Responsive design for desktop and mobile

## Quick Start

### Prerequisites

- Node.js 18+ 
- OpenAI API key
- Kontext API keys (get yours at [dashboard.kontext.dev](https://dashboard.kontext.dev))

### Installation

```bash
# Clone the repository
git clone https://github.com/co-browser/assistant-ui-kontext-starter
cd assistant-ui-kontext-starter

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Configuration

1. Add your API keys to `.env.local`:

```env
# Kontext SDK
NEXT_PUBLIC_KONTEXT_API_KEY=ktextXXXXXXXXXXXXXXXX
KONTEXT_API_KEY=ktextXXXXXXXXXXXXXXXX

# OpenAI
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXX
```

2. Configure allowed origins in your [Kontext Dashboard](https://dashboard.kontext.dev):
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## How It Works

1. **Gmail Connection**: Users authorize Gmail access through Kontext OAuth flow
2. **Context Processing**: Kontext extracts relevant context from emails in the background
3. **Personalized Responses**: AI responses are enhanced with user-specific context
4. **Privacy Control**: Users can disconnect anytime, triggering complete data deletion

### Focused Retrieval (userQuery)

- What it does: Sends your latest message as `userQuery` so the backend retrieves turn-specific context (e.g., a clean, deduped list of projects/legal/docs) without changing your saved persona.
- When to enable: Targeted asks like “List all my projects/legal/docs/visa” or “Give exhaustive details on …”.
- When to disable: Open-ended chat, brainstorming, or when you want broader background context.
- Signals: Response headers show `X-Kontext-UserQuery: 1|0` and `X-Kontext-TurnContext: 1|0` for quick validation.


## Project Structure

```text
├── app/
│   ├── api/chat/route.ts       # AI endpoint with Kontext integration
│   ├── assistant.tsx            # Main chat UI component
│   └── layout.tsx               # App layout with KontextProvider
├── components/
│   ├── kontext-provider.tsx    # Kontext SDK provider wrapper
│   ├── kontext-connect-button.tsx # Gmail connection interface
│   └── assistant-ui/            # Chat UI components
├── hooks/
│   └── useKontextCookie.tsx    # Cookie management for authentication
└── lib/
    └── kontext-store.ts         # Client-side state management
```

## Customization

### AI Provider

The starter is configured for OpenAI. To use another provider:

1. Install the provider package:
```bash
npm install @ai-sdk/anthropic
```

2. Update `app/api/chat/route.ts`:
```typescript
import { anthropic } from "@ai-sdk/anthropic";

const result = streamText({
  model: anthropic("claude-3-sonnet"),
  messages: modelMessages,
});
```

### Privacy Settings

Configure privacy levels in `app/api/chat/route.ts`:

```typescript
const context = await persona.getContext({
  userId,
  task: 'chat',
  privacyLevel: 'strict', // Options: 'strict' | 'moderate' | 'none'
});
```

### Styling

The project uses shadcn/ui components. Customize the theme in:

- `app/globals.css` - Global styles and CSS variables
- `components/ui/` - Individual component styles
- `tailwind.config.js` - Tailwind configuration

## Deployment

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/[YOUR-REPO]/assistant-ui-kontext-starter&env=NEXT_PUBLIC_KONTEXT_API_KEY,KONTEXT_API_KEY,OPENAI_API_KEY)

### Environment Variables

Configure these in your deployment platform:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_KONTEXT_API_KEY` | Client-side Kontext API key |
| `KONTEXT_API_KEY` | Server-side Kontext API key |
| `OPENAI_API_KEY` | OpenAI API key |

### Other Platforms

This is a standard Next.js application and can be deployed to any platform that supports Node.js:

- Railway
- Render
- AWS Amplify
- Netlify
- Self-hosted

## Documentation

- [assistant-ui Documentation](https://www.assistant-ui.com/docs)
- [Kontext SDK Documentation](https://docs.kontext.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

## Support

- [assistant-ui Discord](https://discord.gg/assistant-ui)
- [Kontext Support](https://kontext.dev/support)
- [GitHub Issues](https://github.com/[YOUR-REPO]/assistant-ui-kontext-starter/issues)

## License

MIT

## Contributing

Contributions are welcome. Please submit pull requests with:

- Clear description of changes
- Updated documentation
- Test coverage for new features
