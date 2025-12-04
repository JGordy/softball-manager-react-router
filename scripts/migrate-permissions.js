/**
 * Migration Script: Add Role-Based Permissions to Existing Documents
 *
 * This script updates existing documents in all collections to have proper
 * team-based permissions. Run this BEFORE enabling Row Security in the
 * Appwrite Dashboard.
 *
 * Usage:
 *   node scripts/migrate-permissions.js                    # Run migration
 *   DRY_RUN=true node scripts/migrate-permissions.js       # Preview changes only
 *   ROLLBACK=true node scripts/migrate-permissions.js      # Remove all permissions
 *   CLEANUP=true node scripts/migrate-permissions.js       # Delete orphaned records
 *   DRY_RUN=true CLEANUP=true node scripts/migrate-permissions.js  # Preview cleanup
 *
 * Prerequisites:
 *   - Set environment variables (or use .env file)
 *   - Have node-appwrite installed
 */

import { Client, Databases, Query, Permission, Role } from "node-appwrite";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// Dry run mode - set DRY_RUN=true to preview without making changes
const DRY_RUN = process.env.DRY_RUN === "true";

// Rollback mode - set ROLLBACK=true to remove all permissions (reset to empty)
const ROLLBACK = process.env.ROLLBACK === "true";

// Cleanup mode - set CLEANUP=true to delete orphaned records
const CLEANUP = process.env.CLEANUP === "true";

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_HOST_URL)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

// Collection IDs from environment
const collections = {
    users: process.env.VITE_APPWRITE_USERS_COLLECTION_ID,
    teams: process.env.VITE_APPWRITE_TEAMS_COLLECTION_ID,
    seasons: process.env.VITE_APPWRITE_SEASONS_COLLECTION_ID,
    games: process.env.VITE_APPWRITE_GAMES_COLLECTION_ID,
    parks: process.env.VITE_APPWRITE_PARKS_COLLECTION_ID,
    attendance: process.env.VITE_APPWRITE_ATTENDANCE_COLLECTION_ID,
    awards: process.env.VITE_APPWRITE_GAME_AWARDS_COLLECTION_ID,
    votes: process.env.VITE_APPWRITE_GAME_VOTES_COLLECTION_ID,
};

// Stats tracking
const stats = {
    teams: { total: 0, migrated: 0, skipped: 0, failed: 0 },
    seasons: { total: 0, migrated: 0, skipped: 0, failed: 0 },
    games: { total: 0, migrated: 0, skipped: 0, failed: 0 },
    parks: { total: 0, migrated: 0, skipped: 0, failed: 0 },
    attendance: { total: 0, migrated: 0, skipped: 0, failed: 0 },
    votes: { total: 0, migrated: 0, skipped: 0, failed: 0 },
};

/**
 * Check if document already has team-based permissions
 */
function hasTeamPermissions(permissions) {
    return permissions?.some(
        (perm) => perm.includes("team:") || perm.includes("user:"),
    );
}

/**
 * Fetch all documents from a collection (handles pagination)
 */
async function fetchAllDocuments(collectionId) {
    const allDocuments = [];
    let cursor = null;
    const limit = 100;

    do {
        const queries = [Query.limit(limit)];
        if (cursor) {
            queries.push(Query.cursorAfter(cursor));
        }

        const response = await databases.listDocuments(
            DATABASE_ID,
            collectionId,
            queries,
        );

        allDocuments.push(...response.documents);

        if (response.documents.length < limit) {
            break;
        }

        cursor = response.documents[response.documents.length - 1].$id;
    } while (true);

    return allDocuments;
}

/**
 * Update document permissions
 */
async function updatePermissions(collectionId, documentId, permissions) {
    if (DRY_RUN) {
        console.log(`    [DRY RUN] Would set: ${permissions.join(", ")}`);
        return;
    }

    await databases.updateDocument(
        DATABASE_ID,
        collectionId,
        documentId,
        {}, // No data changes
        permissions,
    );
}

// ============================================================================
// Migration Functions for Each Collection
// ============================================================================

/**
 * Migrate Teams Collection
 * Permissions: read(team), update(manager), delete(manager)
 */
async function migrateTeams() {
    console.log("\n📁 Migrating Teams...");

    const documents = await fetchAllDocuments(collections.teams);
    stats.teams.total = documents.length;

    for (const doc of documents) {
        try {
            if (hasTeamPermissions(doc.$permissions)) {
                console.log(`  ⏭️  Team ${doc.$id} already has permissions`);
                stats.teams.skipped++;
                continue;
            }

            const permissions = [
                Permission.read(Role.team(doc.$id)),
                Permission.update(Role.team(doc.$id, "manager")),
                Permission.delete(Role.team(doc.$id, "manager")),
            ];

            await updatePermissions(collections.teams, doc.$id, permissions);
            console.log(`  ✅ Team ${doc.$id} (${doc.name})`);
            stats.teams.migrated++;
        } catch (error) {
            console.error(`  ❌ Team ${doc.$id}: ${error.message}`);
            stats.teams.failed++;
        }
    }
}

/**
 * Migrate Seasons Collection
 * Permissions: read(team), update(manager, owner), delete(manager, owner)
 */
async function migrateSeasons() {
    console.log("\n📁 Migrating Seasons...");

    const documents = await fetchAllDocuments(collections.seasons);
    stats.seasons.total = documents.length;

    for (const doc of documents) {
        try {
            if (hasTeamPermissions(doc.$permissions)) {
                console.log(`  ⏭️  Season ${doc.$id} already has permissions`);
                stats.seasons.skipped++;
                continue;
            }

            const teamId = doc.teamId;
            if (!teamId) {
                console.log(`  ⚠️  Season ${doc.$id} has no teamId, skipping`);
                stats.seasons.skipped++;
                continue;
            }

            const permissions = [
                Permission.read(Role.team(teamId)),
                Permission.update(Role.team(teamId, "manager")),
                Permission.update(Role.team(teamId, "owner")),
                Permission.delete(Role.team(teamId, "manager")),
                Permission.delete(Role.team(teamId, "owner")),
            ];

            await updatePermissions(collections.seasons, doc.$id, permissions);
            console.log(`  ✅ Season ${doc.$id} (${doc.seasonName})`);
            stats.seasons.migrated++;
        } catch (error) {
            console.error(`  ❌ Season ${doc.$id}: ${error.message}`);
            stats.seasons.failed++;
        }
    }
}

/**
 * Migrate Games Collection
 * Permissions: read(team), update(manager, owner), delete(manager, owner)
 */
async function migrateGames() {
    console.log("\n📁 Migrating Games...");

    const documents = await fetchAllDocuments(collections.games);
    stats.games.total = documents.length;

    // We need to look up teamId from seasons
    const seasonsCache = {};

    for (const doc of documents) {
        try {
            if (hasTeamPermissions(doc.$permissions)) {
                console.log(`  ⏭️  Game ${doc.$id} already has permissions`);
                stats.games.skipped++;
                continue;
            }

            // Get teamId - first check if it's on the game directly
            let teamId = doc.teamId;

            // If not, look it up from the season
            if (!teamId && doc.seasons) {
                const seasonId =
                    typeof doc.seasons === "string"
                        ? doc.seasons
                        : doc.seasons.$id;

                if (!seasonsCache[seasonId]) {
                    try {
                        const season = await databases.getDocument(
                            DATABASE_ID,
                            collections.seasons,
                            seasonId,
                        );
                        seasonsCache[seasonId] = season;
                    } catch (e) {
                        console.log(
                            `  ⚠️  Game ${doc.$id} - could not find season ${seasonId}`,
                        );
                    }
                }

                teamId = seasonsCache[seasonId]?.teamId;
            }

            if (!teamId) {
                console.log(`  ⚠️  Game ${doc.$id} has no teamId, skipping`);
                stats.games.skipped++;
                continue;
            }

            const permissions = [
                Permission.read(Role.team(teamId)),
                Permission.update(Role.team(teamId, "manager")),
                Permission.update(Role.team(teamId, "owner")),
                Permission.delete(Role.team(teamId, "manager")),
                Permission.delete(Role.team(teamId, "owner")),
            ];

            await updatePermissions(collections.games, doc.$id, permissions);
            console.log(`  ✅ Game ${doc.$id} (vs ${doc.opponent || "TBD"})`);
            stats.games.migrated++;
        } catch (error) {
            console.error(`  ❌ Game ${doc.$id}: ${error.message}`);
            stats.games.failed++;
        }
    }
}

/**
 * Migrate Parks Collection
 * Permissions: read(any), update(users), delete(users)
 */
async function migrateParks() {
    console.log("\n📁 Migrating Parks...");

    const documents = await fetchAllDocuments(collections.parks);
    stats.parks.total = documents.length;

    for (const doc of documents) {
        try {
            // Parks use Role.any() and Role.users(), so check differently
            const hasProperPermissions = doc.$permissions?.some(
                (perm) =>
                    perm.includes('read("any")') ||
                    perm.includes('update("users")'),
            );

            if (hasProperPermissions) {
                console.log(`  ⏭️  Park ${doc.$id} already has permissions`);
                stats.parks.skipped++;
                continue;
            }

            const permissions = [
                Permission.read(Role.any()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ];

            await updatePermissions(collections.parks, doc.$id, permissions);
            console.log(`  ✅ Park ${doc.$id} (${doc.name})`);
            stats.parks.migrated++;
        } catch (error) {
            console.error(`  ❌ Park ${doc.$id}: ${error.message}`);
            stats.parks.failed++;
        }
    }
}

/**
 * Migrate Attendance Collection
 * Permissions: read(team), update(user, manager, owner), delete(user, manager, owner)
 */
async function migrateAttendance() {
    console.log("\n📁 Migrating Attendance...");

    const documents = await fetchAllDocuments(collections.attendance);
    stats.attendance.total = documents.length;

    // Cache for games -> seasons -> teamId lookups
    const gamesCache = {};
    const seasonsCache = {};

    for (const doc of documents) {
        try {
            if (hasTeamPermissions(doc.$permissions)) {
                console.log(
                    `  ⏭️  Attendance ${doc.$id} already has permissions`,
                );
                stats.attendance.skipped++;
                continue;
            }

            // Look up teamId through game -> season chain
            let teamId = null;
            const gameId = doc.gameId;

            if (gameId) {
                if (!gamesCache[gameId]) {
                    try {
                        const game = await databases.getDocument(
                            DATABASE_ID,
                            collections.games,
                            gameId,
                        );
                        gamesCache[gameId] = game;
                    } catch (e) {
                        console.log(
                            `  ⚠️  Attendance ${doc.$id} - could not find game ${gameId}`,
                        );
                    }
                }

                const game = gamesCache[gameId];
                teamId = game?.teamId;

                // If game doesn't have teamId directly, look up season
                if (!teamId && game?.seasons) {
                    const seasonId =
                        typeof game.seasons === "string"
                            ? game.seasons
                            : game.seasons.$id;

                    if (!seasonsCache[seasonId]) {
                        try {
                            const season = await databases.getDocument(
                                DATABASE_ID,
                                collections.seasons,
                                seasonId,
                            );
                            seasonsCache[seasonId] = season;
                        } catch (e) {
                            // Season not found
                        }
                    }

                    teamId = seasonsCache[seasonId]?.teamId;
                }
            }

            if (!teamId) {
                console.log(
                    `  ⚠️  Attendance ${doc.$id} has no teamId, skipping`,
                );
                stats.attendance.skipped++;
                continue;
            }

            // Use playerId - the player should be able to update their own attendance
            const playerId = doc.playerId;

            if (!playerId) {
                console.log(
                    `  ⚠️  Attendance ${doc.$id} has no playerId, skipping`,
                );
                stats.attendance.skipped++;
                continue;
            }

            const permissions = [
                Permission.read(Role.team(teamId)),
                Permission.update(Role.user(playerId)),
                Permission.update(Role.team(teamId, "manager")),
                Permission.update(Role.team(teamId, "owner")),
                Permission.delete(Role.user(playerId)),
                Permission.delete(Role.team(teamId, "manager")),
                Permission.delete(Role.team(teamId, "owner")),
            ];

            await updatePermissions(
                collections.attendance,
                doc.$id,
                permissions,
            );
            console.log(`  ✅ Attendance ${doc.$id} (player: ${doc.playerId})`);
            stats.attendance.migrated++;
        } catch (error) {
            console.error(`  ❌ Attendance ${doc.$id}: ${error.message}`);
            stats.attendance.failed++;
        }
    }
}

/**
 * Migrate Votes Collection
 * Permissions: read(team), update(voter), delete(voter, manager, owner)
 */
async function migrateVotes() {
    console.log("\n📁 Migrating Votes...");

    const documents = await fetchAllDocuments(collections.votes);
    stats.votes.total = documents.length;

    for (const doc of documents) {
        try {
            if (hasTeamPermissions(doc.$permissions)) {
                console.log(`  ⏭️  Vote ${doc.$id} already has permissions`);
                stats.votes.skipped++;
                continue;
            }

            const teamId = doc.team_id;
            const voterId = doc.voter_user_id;

            if (!teamId) {
                console.log(`  ⚠️  Vote ${doc.$id} has no team_id, skipping`);
                stats.votes.skipped++;
                continue;
            }

            if (!voterId || voterId === "undefined") {
                console.log(
                    `  ⚠️  Vote ${doc.$id} has no voter_user_id, skipping`,
                );
                stats.votes.skipped++;
                continue;
            }

            const permissions = [
                Permission.read(Role.team(teamId)),
                Permission.update(Role.user(voterId)),
                Permission.delete(Role.user(voterId)),
                Permission.delete(Role.team(teamId, "manager")),
                Permission.delete(Role.team(teamId, "owner")),
            ];

            await updatePermissions(collections.votes, doc.$id, permissions);
            console.log(`  ✅ Vote ${doc.$id} (${doc.reason})`);
            stats.votes.migrated++;
        } catch (error) {
            console.error(`  ❌ Vote ${doc.$id}: ${error.message}`);
            stats.votes.failed++;
        }
    }
}

// ============================================================================
// Cleanup Function - Delete orphaned records
// ============================================================================

async function cleanupOrphanedRecords() {
    console.log("\n🧹 Cleaning up orphaned records...");

    let deletedCount = 0;
    let skippedCount = 0;

    // Clean up orphaned attendance records (those referencing deleted games)
    console.log("\n📁 Checking Attendance for orphaned records...");
    const attendanceDocuments = await fetchAllDocuments(collections.attendance);
    const gamesCache = {};

    for (const doc of attendanceDocuments) {
        const gameId = doc.gameId;

        if (!gameId) {
            console.log(`  ⚠️  Attendance ${doc.$id} has no gameId`);
            continue;
        }

        // Check if game exists
        if (!gamesCache[gameId]) {
            try {
                const game = await databases.getDocument(
                    DATABASE_ID,
                    collections.games,
                    gameId,
                );
                gamesCache[gameId] = { exists: true, game };
            } catch (e) {
                gamesCache[gameId] = { exists: false };
            }
        }

        if (!gamesCache[gameId].exists) {
            if (DRY_RUN) {
                console.log(
                    `  [DRY RUN] Would delete orphaned attendance ${doc.$id} (game ${gameId} not found)`,
                );
                deletedCount++;
            } else {
                try {
                    await databases.deleteDocument(
                        DATABASE_ID,
                        collections.attendance,
                        doc.$id,
                    );
                    console.log(`  🗑️  Deleted orphaned attendance ${doc.$id}`);
                    deletedCount++;
                } catch (e) {
                    console.error(
                        `  ❌ Failed to delete ${doc.$id}: ${e.message}`,
                    );
                }
            }
        } else {
            skippedCount++;
        }
    }

    // Clean up votes with undefined voter_user_id
    console.log("\n📁 Checking Votes for invalid records...");
    const voteDocuments = await fetchAllDocuments(collections.votes);

    for (const doc of voteDocuments) {
        if (!doc.voter_user_id || doc.voter_user_id === "undefined") {
            if (DRY_RUN) {
                console.log(
                    `  [DRY RUN] Would delete vote ${doc.$id} (no voter_user_id)`,
                );
                deletedCount++;
            } else {
                try {
                    await databases.deleteDocument(
                        DATABASE_ID,
                        collections.votes,
                        doc.$id,
                    );
                    console.log(`  🗑️  Deleted invalid vote ${doc.$id}`);
                    deletedCount++;
                } catch (e) {
                    console.error(
                        `  ❌ Failed to delete ${doc.$id}: ${e.message}`,
                    );
                }
            }
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log(
        `🧹 Cleanup Summary: ${deletedCount} deleted, ${skippedCount} valid records`,
    );
    console.log("=".repeat(50));
}

// ============================================================================
// Rollback Function - Remove all permissions
// ============================================================================

async function rollbackAllPermissions() {
    const collectionsToRollback = [
        { name: "teams", id: collections.teams },
        { name: "seasons", id: collections.seasons },
        { name: "games", id: collections.games },
        { name: "parks", id: collections.parks },
        { name: "attendance", id: collections.attendance },
        { name: "votes", id: collections.votes },
    ];

    for (const { name, id } of collectionsToRollback) {
        console.log(`\n🔄 Rolling back ${name}...`);

        const documents = await fetchAllDocuments(id);
        stats[name].total = documents.length;

        for (const doc of documents) {
            try {
                // Skip if already has no permissions
                if (!doc.$permissions || doc.$permissions.length === 0) {
                    console.log(`  ⏭️  ${name} ${doc.$id} has no permissions`);
                    stats[name].skipped++;
                    continue;
                }

                if (DRY_RUN) {
                    console.log(
                        `    [DRY RUN] Would clear permissions on ${doc.$id}`,
                    );
                    stats[name].migrated++;
                    continue;
                }

                await databases.updateDocument(
                    DATABASE_ID,
                    id,
                    doc.$id,
                    {},
                    [], // Empty permissions array
                );
                console.log(`  ✅ Cleared ${name} ${doc.$id}`);
                stats[name].migrated++;
            } catch (error) {
                console.error(`  ❌ ${name} ${doc.$id}: ${error.message}`);
                stats[name].failed++;
            }
        }
    }
}

// ============================================================================
// Main Migration Runner
// ============================================================================

async function runMigration() {
    console.log("🚀 Starting Permissions Migration");
    console.log("=".repeat(50));
    console.log(`Database: ${DATABASE_ID}`);
    console.log(`Endpoint: ${process.env.VITE_APPWRITE_HOST_URL}`);
    if (DRY_RUN) {
        console.log("⚠️  DRY RUN MODE - No changes will be made");
    }
    if (ROLLBACK) {
        console.log("🔄 ROLLBACK MODE - Removing all permissions");
    }
    if (CLEANUP) {
        console.log("🧹 CLEANUP MODE - Deleting orphaned records");
    }
    console.log("=".repeat(50));

    try {
        if (CLEANUP) {
            await cleanupOrphanedRecords();
            return; // Exit after cleanup
        } else if (ROLLBACK) {
            await rollbackAllPermissions();
        } else {
            // Run migrations in order (teams first since others depend on it)
            await migrateTeams();
            await migrateSeasons();
            await migrateGames();
            await migrateParks();
            await migrateAttendance();
            await migrateVotes();
        }

        // Print summary
        console.log("\n" + "=".repeat(50));
        console.log("📊 Migration Summary");
        console.log("=".repeat(50));

        let totalMigrated = 0;
        let totalSkipped = 0;
        let totalFailed = 0;

        for (const [collection, data] of Object.entries(stats)) {
            console.log(
                `\n${collection.toUpperCase()}: ${data.total} documents`,
            );
            console.log(`  ✅ Migrated: ${data.migrated}`);
            console.log(`  ⏭️  Skipped:  ${data.skipped}`);
            console.log(`  ❌ Failed:   ${data.failed}`);

            totalMigrated += data.migrated;
            totalSkipped += data.skipped;
            totalFailed += data.failed;
        }

        console.log("\n" + "=".repeat(50));
        console.log(
            `TOTAL: ${totalMigrated} migrated, ${totalSkipped} skipped, ${totalFailed} failed`,
        );
        console.log("=".repeat(50));

        if (totalFailed > 0) {
            console.log(
                "\n⚠️  Some documents failed to migrate. Check the errors above.",
            );
            process.exit(1);
        } else {
            console.log("\n✅ Migration completed successfully!");
        }
    } catch (error) {
        console.error("\n💥 Migration failed:", error);
        process.exit(1);
    }
}

// Run the migration
runMigration();
