#!/usr/bin/env node

/**
 * Migration Script: Migrate Teams to Appwrite Teams API
 *
 * This script migrates your existing teams and memberships to use Appwrite's
 * built-in Teams API while maintaining your custom team metadata in the database.
 *
 * What it does:
 * 1. Creates Appwrite Team for each database team (using same ID)
 * 2. Migrates all memberships from your table to Appwrite Teams
 * 3. Updates database team records with proper permissions
 *
 * IMPORTANT: NO EMAILS ARE SENT
 * - Uses Server SDK with userId, so members are added silently
 * - No invitation emails, no user notifications
 * - Members are immediately active in their teams
 *
 * Before running:
 * 1. Backup your database!
 * 2. Test on development/staging first
 * 3. Make sure VITE_APPWRITE_API_KEY is set in your .env
 *
 * Usage:
 *   npm run migrate:teams
 *   or
 *   node scripts/migrate-to-appwrite-teams.js
 */

import { Query, Permission, Role } from "node-appwrite";
import { listDocuments } from "../app/utils/databases.js";
import {
    createAppwriteTeam,
    addExistingUserToTeam,
} from "../app/utils/teams.js";
import { updateDocumentPermissions } from "../app/utils/databases.js";

// Color output for terminal
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[36m",
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

async function migrateTeamsToAppwriteAPI() {
    log("\n🚀 Starting migration to Appwrite Teams API...\n", colors.blue);

    try {
        // 1. Get all teams from database
        log("📋 Fetching all teams from database...", colors.blue);
        const allTeams = await listDocuments("teams", [Query.limit(1000)]);

        if (allTeams.rows.length === 1000) {
            log(
                "   ⚠️  WARNING: Hit the 1000 team limit. There may be more teams to migrate!",
                colors.yellow,
            );
        }

        log(
            `   Found ${allTeams.rows.length} teams to migrate\n`,
            colors.green,
        );

        let successCount = 0;
        let failCount = 0;

        for (const team of allTeams.rows) {
            try {
                log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, colors.blue);
                log(
                    `📦 Migrating team: ${team.name} (${team.$id})`,
                    colors.blue,
                );

                // 2. Create Appwrite Team with same ID
                log(`   Creating Appwrite Team...`);
                await createAppwriteTeam({
                    teamId: team.$id, // Use existing ID!
                    name: team.name,
                    roles: ["manager", "player", "coach"],
                });
                log(`   ✓ Created Appwrite Team`, colors.green);

                // 3. Get all memberships for this team from your table
                const memberships = await listDocuments("memberships", [
                    Query.equal("teamId", team.$id),
                ]);

                log(
                    `   Found ${memberships.rows.length} memberships to migrate`,
                );

                // 4. Add members to Appwrite Team
                // IMPORTANT: Using Server SDK with userId = NO emails sent!

                // Map of known roles
                const roleMap = {
                    manager: ["manager"],
                    player: ["player"],
                    coach: ["coach"],
                };

                // Add all memberships, handling unknown roles
                for (const membership of memberships.rows) {
                    const roles = roleMap[membership.role] || ["player"]; // default to player
                    if (!roleMap[membership.role]) {
                        log(
                            `   ⚠️ Unknown role ${membership.role} for user ${membership.userId}, defaulting to player`,
                            colors.yellow,
                        );
                    }
                    try {
                        await addExistingUserToTeam({
                            teamId: team.$id,
                            userId: membership.userId,
                            roles,
                        });
                        log(
                            `   ✓ Added ${membership.role}: ${membership.userId}`,
                            colors.green,
                        );
                    } catch (error) {
                        log(
                            `   ✗ Failed to add ${membership.role} ${membership.userId}: ${error.message}`,
                            colors.red,
                        );
                    }
                }

                // 5. Update database team record with proper permissions
                log(`   Updating team permissions in database...`);
                await updateDocumentPermissions("teams", team.$id, [
                    Permission.read(Role.team(team.$id)),
                    Permission.update(Role.team(team.$id, "manager")),
                    Permission.delete(Role.team(team.$id, "manager")),
                ]);
                log(
                    `   ✓ Updated permissions for team ${team.$id}`,
                    colors.green,
                );

                successCount++;
                log(`   ✓ Team migration complete!`, colors.green);
            } catch (error) {
                failCount++;
                log(
                    `   ✗ Failed to migrate team ${team.$id}: ${error.message}`,
                    colors.red,
                );
                console.error(error);
            }
        }

        log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, colors.blue);
        log(`\n✅ Migration complete!\n`, colors.green);
        log(`📊 Summary:`, colors.blue);
        log(`   Successful: ${successCount}`, colors.green);
        log(`   Failed: ${failCount}`, colors.red);
        log(`   Total: ${allTeams.rows.length}\n`);

        if (failCount === 0) {
            log(`🎉 All teams migrated successfully!\n`, colors.green);
            log(`⚠️  Next steps:`, colors.yellow);
            log(
                `   1. Test thoroughly to ensure everything works`,
                colors.yellow,
            );
            log(
                `   2. Verify team memberships in Appwrite Console`,
                colors.yellow,
            );
            log(
                `   3. After verification, you can delete the 'memberships' table`,
                colors.yellow,
            );
            log(
                `   4. Enable Row Security in Appwrite Console for each collection\n`,
                colors.yellow,
            );
        } else {
            log(
                `⚠️  Some teams failed to migrate. Please review errors above.\n`,
                colors.yellow,
            );
        }
    } catch (error) {
        log(`\n❌ Migration failed with error:`, colors.red);
        console.error(error);
        process.exit(1);
    }
}

// Run migration
log("\n" + "=".repeat(60), colors.blue);
log("  APPWRITE TEAMS MIGRATION SCRIPT", colors.blue);
log("=".repeat(60) + "\n", colors.blue);
log("⚠️  IMPORTANT:", colors.yellow);
log("   • This will migrate all teams to Appwrite Teams API", colors.yellow);
log("   • NO invitation emails will be sent (silent migration)", colors.yellow);
log("   • Make sure you have a database backup!", colors.yellow);
log("   • Test on development environment first\n", colors.yellow);

const args = process.argv.slice(2);
const skipConfirm = args.includes("--yes") || args.includes("-y");

(async () => {
    if (!skipConfirm) {
        log("Type 'yes' to continue: ", colors.yellow);

        // Simple confirmation (works in Node.js)
        const readline = (await import("readline")).default;
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question("", (answer) => {
            rl.close();
            if (answer.toLowerCase() === "yes") {
                migrateTeamsToAppwriteAPI();
            } else {
                log("\n❌ Migration cancelled.\n", colors.red);
                process.exit(0);
            }
        });
    } else {
        migrateTeamsToAppwriteAPI();
    }
})();
