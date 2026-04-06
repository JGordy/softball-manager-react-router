import { Stack, Text, Alert, Group, Button, Badge } from "@mantine/core";
import { IconInfoCircle, IconSparkles } from "@tabler/icons-react";

export default function InitialView({
    aiError,
    onClose,
    onGenerate,
    generationsUsed = 0,
    maxGenerations = 3,
    notEnoughPlayers = false,
}) {
    const remaining = Math.max(0, maxGenerations - generationsUsed);
    const isLimitReached = generationsUsed >= maxGenerations;

    return (
        <Stack>
            <Group justify="space-between" align="center">
                <Text fw={700}>AI Lineup Generation</Text>
                <Badge
                    color={
                        isLimitReached
                            ? "red"
                            : remaining === 1
                              ? "orange"
                              : "blue"
                    }
                    variant="light"
                >
                    {remaining} remaining
                </Badge>
            </Group>
            <Text>
                This will use AI to generate an optimal batting order and
                fielding chart based on manager & player preferences and league
                rules.
            </Text>
            <Text size="sm" c="dimmed">
                Only players who have accepted or are tentative will be included
                in the lineup.
            </Text>
            {notEnoughPlayers && (
                <Alert
                    icon={<IconInfoCircle size={16} />}
                    title="Not enough players"
                    color="orange"
                    variant="light"
                >
                    A minimum of 9 available players is required to generate an
                    AI lineup. Have players mark their availability and try
                    again.
                </Alert>
            )}
            {aiError && (
                <Alert
                    icon={<IconInfoCircle size={16} />}
                    title="Error"
                    color="red"
                >
                    {aiError}
                </Alert>
            )}
            <Group justify="space-between" mt="xl">
                <Button variant="subtle" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    style={{ flexGrow: 1 }}
                    variant="gradient"
                    gradient={{
                        from: "lime",
                        to: "blue",
                        deg: 90,
                    }}
                    onClick={onGenerate}
                    disabled={isLimitReached || notEnoughPlayers}
                    leftSection={<IconSparkles size={18} />}
                >
                    {isLimitReached
                        ? "Limit Reached"
                        : notEnoughPlayers
                          ? "Not Enough Players"
                          : "Generate Lineup"}
                </Button>
            </Group>
        </Stack>
    );
}
