# Appwrite Manager Skill

This skill defines the modern standards and workflows for managing the Appwrite backend in the **RostrHQ / Softball Manager** project.

## 1. Client Initialization

The project uses two primary SDKs: `appwrite` (browser) and `node-appwrite` (server).

### Server-Side (Loaders & Actions)

Use the utilities in `app/utils/appwrite/server.js`:

- `createSessionClient(request)`: Returns a client authenticated as the logged-in user. Use this for most operations to honor Appwrite permissions.
- `createAdminClient()`: Returns a client with full system access via the API Key. Use sparingly for system-level tasks.

### Client-Side (Browser)

Use `app/utils/appwrite/client.js`:

- Exports standard `databases`, `account`, and `teams` services pre-configured with project environment variables.

---

## 2. Database Standard: TablesDB

This project utilizes the **TablesDB** API (the modern replacement for the Collections API) for managing RostrHQ data.

### Key Operations

- **Namespace**: `client.tablesDB` (returned by server-side client helpers).
- **Methods**: `createRow`, `listRows`, `getRow`, `updateRow`, `deleteRow`.
- **Permission Injection**: When creating rows, you MUST manually inject `$permissions` into the data payload if using the `createDocument` helper in `app/utils/databases.js`.

### Collections Map

Refer to `app/utils/databases.js` for the constant mapping:

- `users`: User profile shadow records (synced with Appwrite Auth).
- `teams`: Team-specific data.
- `seasons`: League season partitions.
- `games`: Individual game records.
- `parks`: Venue and location data.
- `attendance`: Player availability and game/event attendance.
- `awards`: Post-game awards (MVP, etc.).
- `votes`: User votes for awards.
- `game_logs`: Real-time scoring and event audit trails.
- `achievements`: Global achievement definitions.
- `user_achievements`: Player-specific achievement unlocks.

---

## 3. User Auth vs. User Database Records

A critical distinction in this project is the separation between Appwrite's built-in Authentication and our custom Player data.

### Appwrite Auth (Users Service)

- **Purpose**: Handles authentication (email, password, sessions, OAuth).
- **Data**: Core identity data only.
- **Service**: Managed via `Account` (client-side) or `Users` (server-side admin).

### Player Data (Users Collection)

- **Purpose**: Stores application-specific metadata and "shadow records" for players.
- **Data**: First/Last name, preferred positions, stats privacy, jersey numbers, and team associations.
- **Service**: Managed via **TablesDB** using the `users` collection ID.
- **Sync Pattern**: The document ID in the `users` collection MUST match the Appwrite User ID ($id). We proactively create these "shadow records" during the invitation flow to store metadata before the user even confirms their account.

---

## 4. Team Invitation Flow (Critical Pattern)

**To send team email invitations, you MUST use a CLIENT-SIDE session client.** Invites triggered via the Admin Client or a standard Server Session client may skip the standard Appwrite verification email logic required by this project.

### The JWT Handoff Pattern:

1.  In a browser-side action (`invitePlayersBrowser` in `app/actions/invitations.js`):
    - Fetch a JWT from the `/api/session` endpoint.
    - Hydrate the Client SDK: `client.setJWT(jwt)`.
2.  Perform `teams.createMembership` without providing a `userId`.
3.  Sync "shadow" records to the database using a server-side Admin Client after the invite succeeds.

---

## 5. Error Handling & UI Patterns

Handle common Appwrite errors (400, 401) using the project's notification system.

### Pattern:

```javascript
import { showNotification } from "@/utils/showNotification";

try {
    await someAppwriteAction();
} catch (error) {
    showNotification({
        variant: "error",
        message: error.message || "An Appwrite error occurred",
        // status 401 -> unauthorized logic
        // status 400 -> bad request logic
    });
}
```
