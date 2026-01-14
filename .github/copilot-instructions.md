# Copilot Instructions for Softball Manager

## Repository Overview

Full-stack React app for managing softball teams, schedules, and player availability. Built with **React Router v7 (SSR)**, **Vite**, **Appwrite** backend, and **Mantine UI**. ~7,600 lines of code.

**Tech Stack:** React Router v7 (SSR) • Vite 6.2.1 • Appwrite • Mantine UI 8.3.1 • TailwindCSS v4 • Jest 30.2.0 • Node.js 20+

## Build & Validation

**Run in order:** `npm ci` → `npm run lint` → `npm run typecheck` → `npm run test` → `npm run build`

**1. Install:** `npm ci` (always use `ci`, not `install`) • ~30s • Installs husky hooks • Ignore deprecated warnings

**2. Lint:** `npm run lint` • Prettier (4 spaces, semicolons, double quotes) • Fix: `npm run format`

**3. Type Check:** `npm run typecheck` • **Expected errors** for `.jsx` files (missing declarations) - ignore them

**4. Test:** `npm run test` • 521 tests • ~5-7s • Tests in `app/**/tests/*.test.js` • Must pass (husky pre-push hook)

**5. Build:** `npm run build` • ~12-15s • Creates `build/client/` & `build/server/` • **Ignore warnings:** unused imports, duplicate identifiers in `.react-router/types/`

**6. Dev:** `npm run dev` • HMR at `http://localhost:5173` • **7. Prod:** `npm run start` (after build)

## CI/CD Pipeline

**`.github/workflows/test.yml`** - Primary gate: Node 24, runs `npm ci` → `npm run test` on all PRs

**`.husky/` hooks:** `pre-commit` (lint+format) • `pre-push` (test)

## Project Structure

```
app/
├── actions/       # Server actions (mutations)
├── components/    # Shared React components
├── loaders/       # Data loaders for routes
├── routes/        # File-based routes
│   ├── auth/      # Login, register, OAuth
│   ├── events/    # Games (details, lineup, scoring)
│   ├── team/      # Team management
│   ├── user/      # Profile, teams
│   ├── layout.jsx # App shell (NavBar, wraps protected routes)
├── utils/         # Utilities
│   └── appwrite/  # Appwrite client/server
├── root.jsx       # Root layout (MantineProvider, theme)
├── routes.js      # Route configuration
```

**Key Files:**
`package.json` (scripts, deps) • `vite.config.ts` (Vite+React Router+TailwindCSS) • `react-router.config.ts` (SSR enabled) • `tsconfig.json` (path aliases) • `jest.config.cjs` (jsdom, babel-jest) • `.prettierrc` (formatting)

## Path Aliases

`@/` or `~/` → `app/` • `@components/` → `app/components/` • `@actions/` → `app/actions/` • `@loaders/` → `app/loaders/` • `@routes/` → `app/routes/` • `@hooks/` → `app/hooks/` • `@forms/` → `app/forms/`

## Code Conventions

- **Files:** `.jsx` for React components, `.js` for utils/actions/loaders
- **Tests:** Place in `tests/` subdirectories, name `*.test.js`
- **Styling:** Mantine components preferred; CSS Modules for custom styles
- **Formatting:** 4 spaces, semicolons, double quotes, trailing commas
- **Server/Client:** Server code in `actions/` and `loaders/`; client in `components/` and `routes/`
- **Auth:** Appwrite; session in HttpOnly cookies
- **Imports:** Use path aliases (`@/`, `@components/`) consistently

## Common Pitfalls & Fixes

**TypeScript errors on `.jsx` files:** Expected; builds succeed anyway - ignore them

**Test console warnings:** Intentional test cases logging expected errors - ignore them

**Dependency issues:** Delete `node_modules/` and `package-lock.json`, run `npm ci`

**Clean build:** `rm -rf build && npm run build`

**Husky hooks not running:** Run `npm ci` or `npm run prepare`

**Appwrite client:**

- Server-side: Import from `@/utils/appwrite/server` (uses cookies)
- Client-side: Import from `@/utils/appwrite/context` (React context)

**Routes:** Defined in `app/routes.js` using `route()` and `layout()`. Public routes outside `layout.jsx`, protected inside.

**Path aliases:** Keep in sync across `vite.config.ts`, `tsconfig.json`, `jest.config.cjs`

## Development Workflow

1. Run `npm ci` (first time)
2. Make changes
3. `npm run lint` (or `npm run format` to auto-fix)
4. `npm run test`
5. Commit (pre-commit auto-formats) → Push (pre-push runs tests)

## Notes

**Trust these instructions first.** Only explore if info is missing/incorrect. TypeScript errors on `.jsx` files and test warnings are expected - don't waste time investigating them.
