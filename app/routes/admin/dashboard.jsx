import { useLoaderData, redirect } from "react-router";

import { Container, SimpleGrid, Title, Text } from "@mantine/core";
import { createAdminClient } from "@/utils/appwrite/server";
import { userContext, appwriteClientContext } from "@/contexts/router";

import { getAdminDashboardData } from "./utils/dashboard";
import { UserDirectory } from "./components/UserDirectory";
import { KPIGrid } from "./components/KPIGrid";
import { AttendanceHealth } from "./components/AttendanceHealth";
import { ParkLeaderboard } from "./components/ParkLeaderboard";
import { TeamRoster } from "./components/TeamRoster";
import { NotificationHealth } from "./components/NotificationHealth";
import { FunctionHealth } from "./components/FunctionHealth";
import { RecognitionStats } from "./components/RecognitionStats";
import { GameLogsBreakdown } from "./components/GameLogsBreakdown";
import { ExternalToolsPanel } from "./components/ExternalToolsMenu";

export async function loader({ request, context }) {
    const url = new URL(request.url);
    const range = url.searchParams.get("range") || "24h";

    // 1. Double check auth & admin label
    const user = context.get(userContext);

    if (!user) {
        throw redirect("/login");
    }

    if (!user.labels?.includes("admin")) {
        throw redirect("/dashboard");
    }

    const adminClient = createAdminClient();
    const { users } = adminClient;
    const sessionClient = context.get(appwriteClientContext);

    return await getAdminDashboardData({
        users,
        client: adminClient,
        sessionClient,
        range,
    });
}

export default function AdminDashboard() {
    const {
        stats,
        recentUsers,
        activeUsers,
        activeParks,
        teamsRoster,
        notificationStats,
        cloudFunctions,
        gameLogsStats,
        recognitionStats,
    } = useLoaderData();

    return (
        <Container size="lg" py="xl">
            <Title order={2} mb="xl">
                Admin Dashboard
            </Title>

            <ExternalToolsPanel />

            {/* ── Platform Totals ── */}
            <div id="platform-totals">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb="sm">
                    Platform Totals
                </Text>
                <KPIGrid stats={stats} />
                <SimpleGrid cols={{ base: 1, md: 2 }} gap="sm" mt="sm" mb="xl">
                    <AttendanceHealth attendance={stats.attendance} />
                    <ParkLeaderboard topParks={activeParks} />
                </SimpleGrid>
            </div>

            {/* ── Engagement & Recognition ── */}
            <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb="sm">
                Engagement &amp; Recognition
            </Text>
            <RecognitionStats stats={recognitionStats} />
            <GameLogsBreakdown logsStats={gameLogsStats} />

            {/* ── Teams & Notifications ── */}
            <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb="sm">
                Teams &amp; Notifications
            </Text>
            <SimpleGrid cols={{ base: 1, md: 2 }} gap="sm" mb="xl">
                <TeamRoster teams={teamsRoster} />
                <NotificationHealth stats={notificationStats} />
            </SimpleGrid>

            {/* ── Cloud Functions ── */}
            <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb="sm">
                Infrastructure
            </Text>
            <FunctionHealth functions={cloudFunctions} />

            {/* ── User Activity ── */}
            <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb="sm">
                User Activity
            </Text>
            <UserDirectory
                recentUsers={recentUsers}
                activeUsers={activeUsers}
            />
        </Container>
    );
}
