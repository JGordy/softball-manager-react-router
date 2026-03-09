import { useOutletContext, useLoaderData } from "react-router";
import { Query } from "node-appwrite";

import { Container } from "@mantine/core";

import {
    updateAccountInfo,
    updatePassword,
    updateUser,
    resetPassword,
} from "@/actions/users";

import { logoutAction } from "@/actions/logout";

import { createSessionClient } from "@/utils/appwrite/server";

import UserHeader from "@/components/UserHeader";

import DesktopSettingsDashboard from "./components/DesktopSettingsDashboard";
import MobileSettingsContainer from "./components/MobileSettingsContainer";

export async function loader({ request }) {
    try {
        const { teams } = await createSessionClient(request);
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

        return { teams: allTeams };
    } catch (error) {
        console.error("Settings loader error:", error);
        return { teams: [] };
    }
}

export async function action({ request }) {
    const formData = await request.formData();
    const { _action, userId, ...values } = Object.fromEntries(formData);

    if (_action === "logout") {
        return logoutAction({ request });
    }

    if (_action === "update-profile-info") {
        return updateUser({ userId, values });
    }

    if (_action === "update-contact") {
        return updateAccountInfo({ values, request });
    }

    if (_action === "update-password") {
        return updatePassword({ values, request });
    }

    if (_action === "password-reset") {
        return resetPassword({ values, request });
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
