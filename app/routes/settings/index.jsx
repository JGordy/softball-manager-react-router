import { useOutletContext, useLoaderData } from "react-router";

import { Accordion, Container } from "@mantine/core";

import {
    updateAccountInfo,
    updatePassword,
    updateUser,
    resetPassword,
} from "@/actions/users";

import { logoutAction } from "@/actions/logout";

import UserHeader from "@/components/UserHeader";
import AccountPanel from "./components/AccountPanel";
import AuthPanel from "./components/AuthPanel";
import NotificationsPanel from "./components/NotificationsPanel";
import { createSessionClient } from "@/utils/appwrite/server";

export async function loader({ request }) {
    try {
        const { teams } = await createSessionClient(request);
        // Fetch all teams with pagination to avoid only loading the first page.
        const pageSize = 100;
        const allTeams = [];
        let cursor = null;
        let hasMore = true;

        while (hasMore) {
            const queries = [`limit(${pageSize})`];
            if (cursor) {
                queries.push(`cursor(${cursor})`);
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
    const { user } = useOutletContext();
    const { teams } = useLoaderData();

    return (
        <Container className="settings-container">
            <UserHeader subText={user?.email} />

            <Accordion
                variant="separated"
                radius="md"
                defaultValue="account"
                mt="xl"
            >
                <Accordion.Item value="account">
                    <Accordion.Control>Account</Accordion.Control>
                    <Accordion.Panel>
                        <AccountPanel actionData={actionData} />
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="authentication">
                    <Accordion.Control>Login Options</Accordion.Control>
                    <Accordion.Panel>
                        <AuthPanel actionData={actionData} />
                    </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="notifications">
                    <Accordion.Control>Notifications</Accordion.Control>
                    <Accordion.Panel>
                        <NotificationsPanel teams={teams} />
                    </Accordion.Panel>
                </Accordion.Item>

                {/* <Accordion.Item value="leagues">
                    <Accordion.Control>Leagues</Accordion.Control>
                    <Accordion.Panel>
                        This feature is under development. Please check back
                        later for updates.
                    </Accordion.Panel>
                </Accordion.Item> */}
            </Accordion>
        </Container>
    );
}
