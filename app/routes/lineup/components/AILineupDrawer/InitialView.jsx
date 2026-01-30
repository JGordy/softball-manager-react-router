import { Stack, Text, Alert, Group, Button } from "@mantine/core";
import { IconInfoCircle, IconSparkles } from "@tabler/icons-react";

export default function InitialView({ aiError, onClose, onGenerate }) {
    return (
        <Stack>
            <Text>
                This will use AI to generate an optimal batting order and
                fielding chart based on manager & player preferences and league
                rules.
            </Text>
            <Text size="sm" c="dimmed">
                Only players who have accepted or are tentative will be included
                in the lineup.
            </Text>
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
                        from: "green",
                        to: "blue",
                        deg: 90,
                    }}
                    onClick={onGenerate}
                    leftSection={<IconSparkles size={18} />}
                >
                    Generate Lineup
                </Button>
            </Group>
        </Stack>
    );
}
