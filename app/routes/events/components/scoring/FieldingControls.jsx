import { Stack, Text, Group, Button } from "@mantine/core";

export default function FieldingControls({ onOut, onRun, onSkip }) {
    return (
        <Stack gap="md">
            <Text size="sm" fw={700} c="dimmed">
                FIELDING CONTROLS
            </Text>
            <Group grow>
                <Button h={80} color="red" radius="md" onClick={onOut}>
                    <Text size="md" fw={900}>
                        OUT
                    </Text>
                </Button>
                <Button h={80} color="green" radius="md" onClick={onRun}>
                    <Text size="md" fw={900}>
                        RUN
                    </Text>
                </Button>
            </Group>
            <Button variant="filled" color="blue" radius="md" onClick={onSkip}>
                Skip to Batting
            </Button>
        </Stack>
    );
}
