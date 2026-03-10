---
description: Procedures for auditing and implementing analytics instrumentation in the codebase.
---

Follow these steps to ensure all major user interactions are properly tracked with Umami analytics using the `trackEvent` utility.

## 1. When to Track

Track all meaningful user interactions that represent progress or intent, including:

- Button clicks for primary actions (e.g., Save, Join team, Submit lineup).
- Form submissions (success and failure if possible).
- Opening/closing key drawers or modals (e.g., AI Lineup Drawer).
- Navigation to internal administrative or specialized areas.

## 2. Implementation Pattern

Always use the `trackEvent` utility imported from "@/utils/analytics".

### Basic Click Tracking

```javascript
import { trackEvent } from "@/utils/analytics";

<Button onClick={() => trackEvent("button-kebab-name")}>Action Label</Button>;
```

### Tracking with Metadata

Include relevant context such as IDs or types to improve data depth.

```javascript
trackEvent("save-lineup", { teamId: user.teamId, version: "ai-generated" });
```

## 3. Naming Conventions (Kebab-Case)

- Use **kebab-case** for event names (e.g., `go-to-admin`, `get-started`, `add-player`). This is the new standard for the project; existing `snake_case` events should be migrated during feature updates.
- Be descriptive but concise.
- Use a `verb-noun` pattern whenever possible (e.g., `join-team`, `view-stats`).

## 4. Verification Checklist

- [ ] Are all primary CTA (Call to Action) buttons tracked on the current route?
- [ ] Do event names follow the kebab-case convention?
- [ ] Is there any sensitive PII (Personally Identifiable Information) being leaked in the metadata? (Never track emails, passwords, or full names).
- [ ] Does the event fire correctly on both mobile and desktop views?
- [ ] If the interaction leads to a redirect, is the event tracked _before_ the navigation occurs?

## 5. Identifying Users

In a top-level **client** layout component (not in route loaders), use a `useEffect` hook to call `identifyUser(userId)` after loader data confirms the user is authenticated. This ensures it only runs in the browser and correctly links sessions across devices.
