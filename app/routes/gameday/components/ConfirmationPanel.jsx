import { Button, Divider, Group, Stack, Text } from "@mantine/core";

import RunnerAdvancementDND from "./RunnerAdvancementDND";
import { getActionColor } from "../utils/drawerUtils";

export function ConfirmationPanel({
    selectedPosition,
    hitLocation,
    playerChart,
    actionType,
    runners,
    runnerResults,
    setRunnerResults,
    handleConfirm,
    variant = "desktop",
    onChangeClick,
    currentBatter,
}) {
    return (
        <>
            <Group justify="space-between" my="sm">
                <Stack gap={0}>
                    <Text size="sm" fw={700}>
                        Fielded by: {selectedPosition}
                    </Text>
                    {hitLocation && (
                        <Text size="xs" c="dimmed">
                            Location: {hitLocation}
                        </Text>
                    )}
                </Stack>
                {onChangeClick && (
                    <Button variant="subtle" size="xs" onClick={onChangeClick}>
                        Change
                    </Button>
                )}
            </Group>

            <Divider label="Runner Advancement" labelPosition="center" />

            <RunnerAdvancementDND
                runners={runners}
                runnerResults={runnerResults}
                setRunnerResults={setRunnerResults}
                playerChart={playerChart}
                actionType={actionType}
                batterId={currentBatter?.$id || currentBatter?.id}
                batterName={currentBatter?.firstName || "Batter"}
                variant={variant}
            />

            <Button
                color={getActionColor(actionType)}
                fullWidth
                size="md"
                radius="md"
                onClick={handleConfirm}
                mt="md"
            >
                Confirm Play
            </Button>
        </>
    );
}

export default ConfirmationPanel;
