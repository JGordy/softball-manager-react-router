import { Stack, Box, Text, Card, Skeleton, Group, Button } from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";

export default function LoadingView({
    loadingText,
    onClose,
    partialLineup = [],
    totalPlayers = 10,
}) {
    // Show valid players first, then skeletons based on the total number of players expected
    const remainingSkeletons = Math.max(1, totalPlayers - partialLineup.length);

    return (
        <Stack gap="xl" py="lg">
            <Stack align="center" gap="xs">
                <Box
                    style={{
                        animation: "pulse 2s ease-in-out infinite",
                    }}
                >
                    <IconSparkles
                        size={48}
                        style={{
                            color: "var(--mantine-color-blue-500)",
                        }}
                    />
                </Box>
                <Text
                    size="lg"
                    fw={500}
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan", deg: 90 }}
                    ta="center"
                >
                    {loadingText}
                </Text>
            </Stack>

            <Card withBorder p="md" radius="md">
                <Stack gap="md">
                    <Text fw={700} size="sm" mb="xs">
                        Batting Order Preview
                    </Text>
                    <Stack gap="sm">
                        {partialLineup.map((player, index) => (
                            <Group
                                key={player.$id || index}
                                gap="xs"
                                wrap="nowrap"
                            >
                                <Text
                                    size="sm"
                                    c="dimmed"
                                    style={{
                                        minWidth: "20px",
                                    }}
                                >
                                    {index + 1}.
                                </Text>
                                <Text size="sm">
                                    {player.firstName} {player.lastName}
                                </Text>
                                <Text size="xs" c="dimmed" ml="auto">
                                    ({player.gender})
                                </Text>
                            </Group>
                        ))}

                        {Array(remainingSkeletons)
                            .fill(0)
                            .map((_, i) => (
                                <Group key={`skel-${i}`} gap="sm">
                                    <Skeleton
                                        height={20}
                                        width={20}
                                        radius="xl"
                                    />
                                    <Skeleton
                                        height={20}
                                        radius="xl"
                                        style={{ flex: 1 }}
                                    />
                                    <Skeleton
                                        height={20}
                                        width={40}
                                        radius="xl"
                                    />
                                </Group>
                            ))}
                    </Stack>
                </Stack>
            </Card>

            <Button variant="subtle" color="red" onClick={onClose} mx="auto">
                Cancel Generation
            </Button>
            <style>{`
            @keyframes pulse {
                0% { opacity: 0.6; transform: scale(0.95); }
                50% { opacity: 1; transform: scale(1.05); }
                100% { opacity: 0.6; transform: scale(0.95); }
            }
        `}</style>
        </Stack>
    );
}
