# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router. Key files: `api/chat/route.ts` (AI endpoint with Kontext), `assistant.tsx` (chat UI), `layout.tsx`, `page.tsx`, `globals.css`.
- `components/`: Reusable UI. Notables: `assistant-ui/*` (chat primitives), `kontext-provider.tsx`, `kontext-connect-button.tsx`, `ui/*` (shadcn-style primitives), `app-sidebar.tsx`.
- `hooks/`: React hooks (`useKontextCookie.tsx`, `use-mobile.ts`).
- `lib/`: Client state/utilities (`kontext-store.ts`, `utils.ts`).
- Config: `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `components.json`.

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server with Turbopack on `http://localhost:3000`.
- `npm run build`: Production build.
- `npm start`: Run the production build.
- `npm run lint`: Lint with Next/ESLint rules.
Examples:
```
cp .env.example .env.local && npm install && npm run dev
```
pnpm and yarn also work if preferred.

## Coding Style & Naming Conventions
- Language: TypeScript with `strict` enabled.
- Indentation: 2 spaces; include semicolons.
- Files: kebab-case for files (`my-component.tsx`), PascalCase for React components, hooks start with `use*`.
- Imports: use `@/*` path alias when appropriate; prefer named exports.
- Linting: `eslint-config-next` (`core-web-vitals`, `typescript`). Fix issues before committing.

## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Name tests `*.test.ts`/`*.test.tsx` near the unit under test or in `__tests__/`.
- Cover: API route logic (`app/api/chat/route.ts`), hooks, and component behavior (streaming, error states).

## Commit & Pull Request Guidelines
- Commits: short, imperative subject (≤72 chars). Example: `Fix Kontext dashboard URL`.
- PRs: focused scope; include description, linked issues (`Closes #123`), and screenshots for UI changes.
- Requirements: update docs when behavior/UX changes; ensure `npm run lint` and a local run pass.

## Security & Configuration Tips
- Secrets: use `.env.local`; never commit keys. Required: `OPENAI_API_KEY`, `KONTEXT_API_KEY`, `NEXT_PUBLIC_KONTEXT_API_KEY`.
- Kontext: set allowed origins in the dashboard (dev: `http://localhost:3000`).
- Logs: remove verbose debug logs before shipping.
