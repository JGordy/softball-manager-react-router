import { Suspense, useState } from "react";
import { Await } from "react-router";

import { SimpleGrid, Stack, Alert, Card, Text, Box } from "@mantine/core";
import { IconTrophy } from "@tabler/icons-react";

import AchievementCard from "@/components/AchievementCard";
import LoaderDots from "@/components/LoaderDots";

export default function PlayerAchievements({ achievementsPromise }) {
    const [activeFilter, setActiveFilter] = useState("all");
    return (
        <Suspense fallback={<LoaderDots />}>
            <Await resolve={achievementsPromise}>
                {(achievements) => {
                    if (!achievements || achievements.length === 0) {
                        return (
                            <Alert
                                icon={<IconTrophy size={16} />}
                                title="No Achievements Yet"
                                color="gray"
                                radius="md"
                            >
                                Keep playing to unlock achievements and earn your spot in the hall of fame!
                            </Alert>
                        );
                    }

                    // Filter out any broken relationships
                    const validAchievements = achievements.filter(ua => ua.achievement);

                    if (validAchievements.length === 0) {
                        return (
                            <Alert
                                icon={<IconTrophy size={16} />}
                                title="No Achievements Yet"
                                color="gray"
                                radius="md"
                            >
                                Keep playing to unlock achievements and earn your spot in the hall of fame!
                            </Alert>
                        );
                    }

                    // We could group by season/career/game here.
                    // For now, let's just render them all sorted by rarity.
                    // Calculate stats for the dashboard
                    const stats = achievements.reduce((acc, ua) => {
                        const rarity = ua.achievement?.rarity?.toLowerCase();
                        acc.total++;
                        if (rarity === 'legendary') acc.legendary++;
                        if (rarity === 'epic') acc.epic++;
                        if (rarity === 'rare') acc.rare++;
                        if (rarity === 'uncommon') acc.uncommon++;
                        return acc;
                    }, { total: 0, legendary: 0, epic: 0, rare: 0, uncommon: 0 });

                    const sorted = [...validAchievements].sort((a, b) => {
                        const weights = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
                        const weightA = weights[a.achievement.rarity?.toLowerCase()] || 0;
                        const weightB = weights[b.achievement.rarity?.toLowerCase()] || 0;
 
                        // Sort by rarity first
                        if (weightA !== weightB) return weightB - weightA;
 
                        // Then by date
                        return new Date(b.$createdAt) - new Date(a.$createdAt);
                    });

                    const filtered = activeFilter === "all" 
                        ? sorted 
                        : sorted.filter(ua => ua.achievement.rarity?.toLowerCase() === activeFilter);

                    const filterItems = [
                        { key: "all", label: "All", value: stats.total, color: "blue", activeColor: "blue.6" },
                        { key: "legendary", label: "Legendary", value: String(stats.legendary).padStart(2, '0'), color: "yellow.5", activeColor: "yellow.6" },
                        { key: "epic", label: "Epic", value: String(stats.epic).padStart(2, '0'), color: "grape.5", activeColor: "grape.6" },
                        { key: "rare", label: "Rare", value: String(stats.rare).padStart(2, '0'), color: "blue.5", activeColor: "blue.6" },
                        { key: "uncommon", label: "Uncommon", value: String(stats.uncommon).padStart(2, '0'), color: "teal.5", activeColor: "teal.6" },
                    ];

                    return (
                        <Stack gap="xl">
                            {/* Summary Dashboard */}
                            <SimpleGrid cols={5} spacing="xs">
                                {filterItems.map((item) => {
                                    const isActive = activeFilter === item.key;
                                    const themeColor = item.key === 'all' ? 'blue' : (item.key === 'legendary' ? 'yellow' : (item.key === 'epic' ? 'grape' : (item.key === 'rare' ? 'blue' : 'teal')));
                                    
                                    return (
                                        <Card 
                                            key={item.key}
                                            p="xs" 
                                            radius="md" 
                                            withBorder
                                            onClick={() => setActiveFilter(item.key)}
                                            data-testid={`rarity-filter-${item.key}`}
                                            style={{ 
                                                cursor: 'pointer',
                                                borderColor: isActive ? `var(--mantine-color-${themeColor}-6)` : undefined,
                                                borderWidth: isActive ? '2px' : '1px',
                                                backgroundColor: isActive ? 'light-dark(var(--mantine-color-gray-0), rgba(255, 255, 255, 0.05))' : undefined,
                                                transition: 'all 0.2s ease',
                                                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                                            }}
                                        >
                                            <Stack gap={0} align="center">
                                                <Text size="10px" fw={700} c={isActive ? item.activeColor : "dimmed"} style={{ textTransform: 'uppercase' }}>{item.label}</Text>
                                                <Text size="md" fw={900} c={item.key === 'all' ? (isActive ? 'blue.6' : undefined) : item.color}>{item.value}</Text>
                                            </Stack>
                                        </Card>
                                    );
                                })}
                            </SimpleGrid>

                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                {filtered.length > 0 ? (
                                    filtered.map((ua) => (
                                        <AchievementCard
                                            key={ua.$id}
                                            achievement={ua.achievement}
                                            unlockedAt={ua.$createdAt}
                                            playerName="YOU"
                                            isMe={true}
                                        />
                                    ))
                                ) : (
                                    <Box py="xl" style={{ gridColumn: 'span 2' }}>
                                        <Text ta="center" c="dimmed">No {activeFilter} achievements yet.</Text>
                                    </Box>
                                )}
                            </SimpleGrid>
                        </Stack>
                    );
                }}
            </Await>
        </Suspense>
    );
}
