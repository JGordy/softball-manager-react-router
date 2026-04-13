# GEMINI.md: Project Standards & Context

This document serves as the "Source of Truth" for AI agents and developers working on the **Softball Manager** project. It defines the project's vision, technical architecture, and quality standards.

---

## 1. Project Vision: "The Synthetic Arena"

**Softball Manager** is a high-performance sports management platform designed for amateur and semi-pro softball teams.

- **Core Purpose**: Streamline team management, schedule tracking, player availability, and real-time game scoring.
- **Aesthetic**: The **Velocity Dark** design system uses deep midnight navies (`#111827`), elevated surfaces (`#1F2937`), and high-visibility neon accents (`#CCFF33`).
- **User Experience**: Mobile-first, editorial-style data visualization, and immersive live-game interfaces (e.g., the interactive baseball diamond).

---

## 2. Contextual Rules & Patterns

### Tech Stack

- **Framework**: React Router v7 (Vite-powered).
- **UI Library**: [Mantine UI](https://mantine.dev/) (v8+).
- **Icons**: Tabler Icons.
- **Styling**: PostCSS + CSS Modules.
- **Runtime**: Node.js (SSR focused).

### Coding Standards

- **Component Style**: Use **Functional Components with Hooks**. Avoid class components.
- **Data Flow**: Leverage React Router's `loader` for data fetching and `action` for mutations. Use `Form`, `useFetcher`, and `useLoaderData` extensively. For data streaming, return raw promises directly from loaders (React Router v7 handles these automatically without `defer`).
- **Typography**: Primary font is `Lexend`. Use Mantine's `Title` and `Text` components with specified design tokens.
- **File Structure**:
    - `app/routes/`: Route definitions and page components.
    - `app/components/`: Reusable UI components.
    - `app/utils/`: Shared logic, API configurations, and helper functions.
    - `app/actions/` & `app/loaders/`: Decoupled server-side logic when routes become complex.

---

## 3. Backend Integration

### Appwrite (BaaS)

The project uses Appwrite for Auth, Database, and Storage.

- **Client Side**: Use `app/utils/appwrite/client.js` and `AppwriteProvider` (context) for client-side interactions and real-time subscriptions.
- **Server Side**:
    - Use `createSessionClient(request)` in loaders/actions to act on behalf of the logged-in user.
    - Use `createAdminClient()` sparingly for system-level operations requiring an API Key.
- **Auth Flow**: Session secrets are stored in a `appwrite-session` cookie.

### Render (Deployment)

- **Workflow**: Continuous Deployment via GitHub.
- **Build Command**: `npm run build`
- **Start Command**: `npm run start` (uses `react-router-serve`)
- **Environment**: All `APPWRITE_*` and `SENTRY_DSN` variables must be configured in the Render Dashboard.

---

## 4. Definition of Done (DoD)

Code is considered "Complete" only when it meets the following criteria:

1.  **Documentation**: All new functions and components must have **JSDoc** blocks.
2.  **Quality**: `npm run lint` and `npm run format` pass without errors.
3.  **Testing**:
    - Unit tests (Jest + RTL) exist for core logic and shared components.
    - Existing test suite passes (`npm run test`).
4.  **Verification**: UI changes must be visually verified in the built-in browser tool across mobile and desktop breakpoints.
5.  **Performance**: Loaders must be optimized (return raw promises for non-critical data to enable streaming) to prevent blocking the UI.

---

## 5. Tooling & Workflows

- **Local Development**: `npm run dev` starts the React Router dev server on port `5173`.
- **UI Testing**: Always use the **built-in browser tool** to verify:
    - Interactive elements (drag-and-drop, modals).
    - Responsive layouts (Mobile-first).
    - Theme consistency (Velocity Dark tokens).
- **Deployment Pre-check**: Run `npm run build` locally to ensure SSR bundles are correctly generated before pushing to production.
