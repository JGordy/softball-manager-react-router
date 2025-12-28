# OAuth2 & Profile Onboarding Walkthrough

I have implemented OAuth2 authentication with Google, along with a mandatory profile onboarding flow.

## Key Changes

### 1. OAuth2 Core Logic

Created server-side routes to handle the OAuth handshake securely using HttpOnly cookies.

- **[oauth.jsx](./oauth.jsx)**: Redirects users to Google.
- **[callback.jsx](./callback.jsx)**: Receives the session from Appwrite and sets the cookie.

### 2. Profile Onboarding Flow

Added a mandatory setup flow to ensure all users have a name.

- **[setup.jsx](./setup.jsx)**: A dedicated page for users to complete their profile.
- **Onboarding Check**: Added logic to **[layout.jsx](../layout.jsx)** to detect incomplete profiles and redirect users to the setup page.

### 3. Advanced Avatar Handling

- **[UserAvatar.jsx](../../components/UserAvatar.jsx)**: A new component that uses Google's avatar if available, or falls back to the Appwrite Avatars (Initials) API.

### 4. UI Integration

- Added a Google sign-in button to both **[login.jsx](./login.jsx)** and **[register.jsx](./register.jsx)**.

## Verification

- All new routes are registered in **[routes.js](../../routes.js)**.
- Authentication redirect and cookie serialization are consistent with your existing patterns.

## Next Steps

1.  **Dashboard Configuration**: Enable Google in your Appwrite Console.
2.  **Environment Variables**: Refer to **[.env.example](../../../.env.example)** for the required keys.

## Bug Fixes

- **Vite SSR Support**: Fixed an issue where `createContext` (internal to React Router v7 data handling) was inconsistently exported in certain SSR environments. I updated `app/utils/appwrite/context.js` to use a more resilient import pattern.
