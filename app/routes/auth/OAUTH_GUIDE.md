# Auth, OAuth2 & Profile Onboarding Walkthrough

I have implemented a comprehensive authentication system featuring OAuth2 with Google, mandatory profile onboarding, and standard account management flows.

## Key Changes

### 1. OAuth2 Core Logic

Created server-side routes to handle the OAuth handshake securely using HttpOnly cookies.

- **[oauth.jsx](./oauth.jsx)**: Validates the provider (Google) and redirects users to Appwrite's OAuth2 authorization URL. It enforces HTTPS in non-localhost environments.
- **[callback.jsx](./callback.jsx)**:
    - Exchanges the OAuth token for a persistent session.
    - **Idempotent User Setup**: Automatically creates a User document in the database if it doesn't exist.
    - **Avatar Sync**: Fetches the user's Google profile picture (via Google Identity API) and persists it to both the user's preferences and the database document.
    - Sets the `appwrite-session` HttpOnly cookie for SSR support.

### 2. Profile Onboarding Flow

Added a mandatory setup flow to ensure all users provide a valid name for team rosters.

- **[setup.jsx](./setup.jsx)**: A dedicated onboarding page where users can update their "Generic" or missing name.
- **[layout.jsx](../layout.jsx) Guard**: Protected routes are guarded by a check for incomplete profiles (`user.name === "User"` or empty). Users with incomplete profiles are redirected to `/auth/setup`.
- **Mobile-First Redirection**: The app uses `redirectIfAuthenticated` to manage entry points. Desktop users are redirected to `/`, while mobile users are directed to `/dashboard` upon login or registration.

### 3. Account Management

Extended the auth suite with standard recovery and verification routes:

- **[forgot-password.jsx](./forgot-password.jsx)**: Triggers Appwrite password recovery emails.
- **[recover.jsx](./recover.jsx)**: Handles the password reset via token/secret pairs.
- **[verify.jsx](./verify.jsx)**: Client-side route that completes email verification on mount and redirects to login.

### 4. UI & Components

- **[UserAvatar.jsx](../../components/UserAvatar.jsx)**: Dynamically renders avatars using the synced `avatarUrl` from Google or falling back to the Appwrite Avatars (Initials) API.
- **Google Integration**: Added `GoogleButton` to **[login.jsx](./login.jsx)** and **[register.jsx](./register.jsx)**.
- **Bad Word Validation**: **[register.jsx](./register.jsx)** includes server-side validation to prevent inappropriate names during account creation.

## Verification & Testing

- **Automated Tests**: Comprehensive unit tests for all routes are located in `app/routes/auth/tests/`.
- **Route Registration**: All paths are correctly mapped in **[routes.js](../../routes.js)**.
- **Security**: HttpOnly cookies are used for session management to support Vite SSR and prevent XSS-based token theft.

## Next Steps

1. **Appwrite Console**: Enable the **Google** provider in your Appwrite project and configure the callback URL to include your production domain.
2. **Environment Variables**: Ensure `APPWRITE_DATABASE_ID` and collection IDs are correctly set in your `.env`.

## Bug Fixes

- **Vite SSR Support**: Fixed an issue where `createContext` (internal to React Router v7 data handling) was inconsistently exported in certain SSR environments. I updated `app/utils/appwrite/context.js` to use a more resilient import pattern.
