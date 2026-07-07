import { useOutletContext, useLoaderData } from "react-router";
import { Query } from "node-appwrite";

import { Container } from "@mantine/core";

import {
    updateAccountInfo,
    updatePassword,
    updateUser,
    updateUserPrefs,
    resetPassword,
} from "@/actions/users";

import { logoutAction } from "@/actions/logout";

import UserHeader from "@/components/UserHeader";
import { appwriteClientContext } from "@/contexts/router";
import { listDocuments } from "@/utils/databases";

import DesktopSettingsDashboard from "./components/DesktopSettingsDashboard";
import MobileSettingsContainer from "./components/MobileSettingsContainer";

export async function loader({ context }) {
    try {
        const client = context.get(appwriteClientContext);
        const { teams } = client;
        // Fetch all teams with pagination to avoid only loading the first page.
        const pageSize = 100;
        const allTeams = [];
        let cursor = null;
        let hasMore = true;

        while (hasMore) {
            const queries = [Query.limit(pageSize)];
            if (cursor) {
                queries.push(Query.cursorAfter(cursor));
            }

            const page = await teams.list(queries);
            const pageTeams = page?.teams ?? [];
            allTeams.push(...pageTeams);

            if (pageTeams.length < pageSize) {
                hasMore = false;
            } else {
                const lastTeam = pageTeams[pageTeams.length - 1];
                cursor = lastTeam?.$id ?? null;
                if (!cursor) {
                    hasMore = false;
                }
            }
        }

        // Cross-reference DB documents to filter out archived teams.
        // The Appwrite Teams API doesn't carry the `archived` flag, only the DB document does.
        const allTeamIds = allTeams.map((t) => t.$id);
        const unarchivedIds = new Set();

        if (allTeamIds.length > 0) {
            const batchSize = 100;
            for (let i = 0; i < allTeamIds.length; i += batchSize) {
                const batchIds = allTeamIds.slice(i, i + batchSize);
                try {
                    const result = await listDocuments(
                        "teams",
                        [Query.equal("$id", batchIds)],
                        client,
                    );
                    if (result.rows) {
                        result.rows.forEach((doc) => {
                            if (!doc.archived) {
                                unarchivedIds.add(doc.$id);
                            }
                        });
                    }
                } catch (e) {
                    console.error("Failed to batch fetch teams", e);
                }
            }
        }

        const activeTeams = allTeams.filter((t) => unarchivedIds.has(t.$id));

        return { teams: activeTeams };
    } catch (error) {
        console.error("Settings loader error:", error);
        return { teams: [] };
    }
}

export async function action({ request, context }) {
    const formData = await request.formData();
    const { _action, userId, ...values } = Object.fromEntries(formData);
    const client = context.get(appwriteClientContext);

    if (_action === "logout") {
        return logoutAction({ client });
    }

    if (_action === "update-profile-info") {
        return updateUser({ userId, values, client });
    }

    if (_action === "update-contact") {
        return updateAccountInfo({ values, client });
    }

    if (_action === "update-password") {
        return updatePassword({ values, client });
    }

    if (_action === "password-reset") {
        return resetPassword({ values, client, requestUrl: request.url });
    }

    if (_action === "update-user-preferences") {
        return updateUserPrefs({ values, client });
    }

    return null;
}

export default function Settings({ actionData }) {
    const { user, isDesktop } = useOutletContext();
    const { teams } = useLoaderData();

    return (
        <Container size="xl" className="settings-container">
            <UserHeader subText={user?.email} />

            {isDesktop ? (
                <DesktopSettingsDashboard
                    actionData={actionData}
                    teams={teams}
                />
            ) : (
                <MobileSettingsContainer
                    actionData={actionData}
                    teams={teams}
                />
            )}
        </Container>
    );
}
