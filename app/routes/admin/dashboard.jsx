import { useEffect } from "react";
import {
    useLoaderData,
    redirect,
    useRevalidator,
    useSearchParams,
} from "react-router";

import {
    Badge,
    Container,
    Group,
    SimpleGrid,
    Title,
    Text,
    SegmentedControl,
    Stack,
} from "@mantine/core";

import {
    createAdminClient,
    createSessionClient,
} from "@/utils/appwrite/server";

import { getAdminDashboardData } from "./utils/dashboard";
import { ItemCard } from "./components/ItemCard";
import { DashboardSection } from "./components/DashboardSection";
import { KPIGrid } from "./components/KPIGrid";
import { AnalyticsSummary } from "./components/AnalyticsSummary";
import { AttendanceHealth } from "./components/AttendanceHealth";
import { FeaturePopularity } from "./components/FeaturePopularity";
import { AILineupMetrics } from "./components/AILineupMetrics";
import { ParkLeaderboard } from "./components/ParkLeaderboard";
import { MobileDashboardNav } from "./components/DashboardNav";

export async function loader({ request }) {
    const url = new URL(request.url);
    const range = url.searchParams.get("range") || "24h";

    // 1. Double check auth & admin label
    const { account } = await createSessionClient(request);
    let user;
    try {
        user = await account.get();
    } catch (e) {
        throw redirect("/login");
    }

    if (!user.labels?.includes("admin")) {
        throw redirect("/dashboard");
    }

    const { users } = createAdminClient();

    return await getAdminDashboardData({ users, range });
}

export default function AdminDashboard() {
    const {
        stats,
        recentUsers,
        activeUsers,
        activeTeams,
        activeParks,
        topFeatures,
        aiLineupMetrics,
        range,
    } = useLoaderData();
    const revalidator = useRevalidator();
    const [, setSearchParams] = useSearchParams();

    // Auto-refresh the dashboard every 10 seconds for "live" updates
    useEffect(() => {
        const interval = setInterval(() => {
            if (revalidator.state === "idle") {
                revalidator.revalidate();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [revalidator]);

    const handleRangeChange = (value) => {
        setSearchParams((prev) => {
            prev.set("range", value);
            return prev;
        });
    };

    return (
        <Container size="lg" py="xl">
            <Stack gap="xs" mb="xl">
                <Group justify="space-between" align="center">
                    <Title order={2}>Admin Dashboard</Title>
                    <Badge
                        color={
                            revalidator.state === "loading" ? "yellow" : "green"
                        }
                        size="lg"
                        variant="light"
                    >
                        {revalidator.state === "loading"
                            ? "Updating..."
                            : "Live"}
                    </Badge>
                </Group>
                <Group justify={{ base: "center", sm: "flex-start" }}>
                    <SegmentedControl
                        color="green"
                        value={range}
                        onChange={handleRangeChange}
                        data={[
                            { label: "24h", value: "24h" },
                            { label: "7d", value: "7d" },
                            { label: "30d", value: "30d" },
                        ]}
                        radius="md"
                        size="sm"
                        w={{ base: "100%", sm: "auto" }}
                    />
                </Group>
            </Stack>

            <MobileDashboardNav />

            {/* Section 1: Platform Totals (Appwrite Data) */}
            <Stack id="platform-totals" gap="sm" mb="xl">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    Platform Totals
                </Text>
                <KPIGrid stats={stats} />
                <SimpleGrid cols={{ base: 1, md: 2 }} gap="sm">
                    <AttendanceHealth attendance={stats.attendance} />
                    <ParkLeaderboard topParks={activeParks} />
                </SimpleGrid>
            </Stack>

            {/* Section 2: Analytics & Performance (Umami Data - Respects Timeframe) */}
            <Stack id="analytics-performance" gap="md" mb="xl">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    Analytics & Performance
                </Text>
                <div id="analytics-summary">
                    <AnalyticsSummary umami={stats.umami} range={range} />
                </div>
                <SimpleGrid cols={{ base: 1, md: 2 }} gap="xl">
                    <AILineupMetrics
                        aiLineupMetrics={aiLineupMetrics}
                        range={range}
                    />
                    <FeaturePopularity
                        topFeatures={topFeatures}
                        range={range}
                    />
                </SimpleGrid>
            </Stack>

            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} gap="xl">
                <DashboardSection
                    id="team-sections"
                    title="Most Active Teams"
                    items={activeTeams}
                    initialLimit={3}
                    renderItem={(t) => (
                        <ItemCard
                            key={`team-${t.id}`}
                            text={t.name}
                            subText={`ID: ${t.id}`}
                            bgColor={t.primaryColor}
                            rightSection={
                                <Badge
                                    color={t.primaryColor ? "white" : "green"}
                                    variant={t.primaryColor ? "white" : "light"}
                                    c={t.primaryColor || undefined}
                                >
                                    {t.views.toLocaleString()} views
                                </Badge>
                            }
                        />
                    )}
                />

                <DashboardSection
                    id="user-sections"
                    title="Recent Signups"
                    items={recentUsers}
                    renderItem={(u) => (
                        <ItemCard
                            key={`signup-${u.$id}`}
                            text={u.name || "Unknown"}
                            subText={u.email}
                            rightSection={
                                <Text size="sm">
                                    {new Date(
                                        u.registration,
                                    ).toLocaleDateString()}
                                </Text>
                            }
                        />
                    )}
                />

                <DashboardSection
                    id="active-users-section"
                    title="Recently Active"
                    items={activeUsers}
                    renderItem={(u) => (
                        <ItemCard
                            key={`active-${u.$id}`}
                            text={u.name || "Unknown"}
                            subText={u.email}
                            rightSection={
                                <Badge
                                    size="xs"
                                    variant="light"
                                    color={
                                        new Date() - new Date(u.accessedAt) <
                                        10 * 60 * 1000
                                            ? "green"
                                            : "gray"
                                    }
                                >
                                    {u.accessedAt
                                        ? new Date(u.accessedAt).toLocaleString(
                                              [],
                                              {
                                                  month: "numeric",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              },
                                          )
                                        : "Never"}
                                </Badge>
                            }
                        />
                    )}
                />
            </SimpleGrid>
        </Container>
    );
}
