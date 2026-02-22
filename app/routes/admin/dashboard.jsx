import { useEffect } from "react";
import { useLoaderData, redirect, useRevalidator } from "react-router";

import {
    Badge,
    Container,
    Group,
    SimpleGrid,
    Title,
    Text,
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
import { ParkLeaderboard } from "./components/ParkLeaderboard";
import { MobileDashboardNav } from "./components/DashboardNav";

export async function loader({ request }) {
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

    return await getAdminDashboardData({ users });
}

export default function AdminDashboard() {
    const {
        stats,
        recentUsers,
        activeUsers,
        activeTeams,
        activeParks,
        topFeatures,
    } = useLoaderData();
    const revalidator = useRevalidator();

    // Auto-refresh the dashboard every 10 seconds for "live" updates
    useEffect(() => {
        const interval = setInterval(() => {
            if (revalidator.state === "idle") {
                revalidator.revalidate();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [revalidator]);

    return (
        <Container size="lg" py="xl">
            <Group justify="space-between" mb="xl">
                <Title order={2}>Admin Dashboard</Title>
                <Badge
                    color={revalidator.state === "loading" ? "yellow" : "green"}
                    size="lg"
                    variant="light"
                >
                    {revalidator.state === "loading" ? "Updating..." : "Live"}
                </Badge>
            </Group>

            <MobileDashboardNav />

            <KPIGrid stats={stats} />

            <div id="analytics-summary">
                <AnalyticsSummary umami={stats.umami} />
            </div>

            <SimpleGrid
                id="insights"
                cols={{ base: 1, md: 3 }}
                gap="xl"
                mb="xl"
            >
                <AttendanceHealth attendance={stats.attendance} />
                <FeaturePopularity topFeatures={topFeatures} />
                <ParkLeaderboard topParks={activeParks} />
            </SimpleGrid>

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
