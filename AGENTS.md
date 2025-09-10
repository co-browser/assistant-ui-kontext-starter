# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages and API.
  - `api/chat/route.ts` — AI endpoint with Kontext.
  - `assistant.tsx`, `layout.tsx`, `page.tsx`, `globals.css`.
- `components/`: Reusable UI.
  - `assistant-ui/*`, `kontext-provider.tsx`, `kontext-connect-button.tsx`, `ui/*`, `app-sidebar.tsx`.
- `hooks/`: React hooks (`useKontextCookie.tsx`, `use-mobile.ts`).
- `lib/`: Client state/utilities (`kontext-store.ts`, `utils.ts`).
- Config: `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `components.json`.
- Tests: colocate `*.test.ts(x)` near code or in `__tests__/`.

## Build, Test, and Development Commands
- `cp .env.example .env.local && npm install && npm run dev` — start local dev at `http://localhost:3000`.
- `npm run build` — create a production build.
- `npm start` — run the production build.
- `npm run lint` — lint with Next/ESLint rules.
- `npm test` — run Vitest (or `pnpm test` / `yarn test`).

## Coding Style & Naming Conventions
- Language: TypeScript (`strict` enabled). Indentation: 2 spaces; include semicolons.
- Files: kebab-case (`my-component.tsx`). Components: PascalCase. Hooks: `use*`.
- Imports: prefer `@/*` path alias; use named exports.
- Linting: `eslint-config-next` (`core-web-vitals`, `typescript`). Fix warnings before PRs.

## Testing Guidelines
- Stack: Vitest + React Testing Library.
- Name tests `*.test.ts`/`*.test.tsx`; colocate near units or in `__tests__/`.
- Cover API route logic (`app/api/chat/route.ts`), hooks, and component behavior (streaming, error states).
- Run via package script; keep tests deterministic and fast.

## Commit & Pull Request Guidelines
- Commits: short, imperative subject (≤72 chars). Example: `Fix Kontext dashboard URL`.
- PRs: focused scope; include description, linked issues (e.g., `Closes #123`), and screenshots for UI changes.
- Requirements: update docs when behavior/UX changes; ensure `npm run lint` and a local run pass.

## Security & Configuration Tips
- Store secrets in `.env.local`; never commit keys.
- Required: `OPENAI_API_KEY`, `KONTEXT_API_KEY`, `NEXT_PUBLIC_KONTEXT_API_KEY`.
- Kontext: set allowed origins in the dashboard (dev: `http://localhost:3000`).
- Remove verbose debug logs before shipping.

