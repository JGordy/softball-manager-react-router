import { Badge, Button, Divider, Group, Stack, Text } from "@mantine/core";

import DiamondView from "./DiamondView";
import RunnerPanel from "./RunnerPanel";
import { getActionColor } from "../utils/drawerUtils";

export function ConfirmationPanel({
    selectedPosition,
    hitLocation,
    runsScored,
    outsRecorded,
    occupiedBases,
    projectedRunners,
    playerChart,
    actionType,
    runners,
    outs,
    runnerResults,
    setRunnerResults,
    handleConfirm,
    onChangeClick,
}) {
    const getPlayerName = (id) => {
        if (!id) return "Empty";
        if (id === "Batter") return "Batter";
        const player = playerChart?.find((p) => p.$id === id);
        return player ? `${player.firstName}` : "Unknown";
    };

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

            <Group align="start" grow wrap="nowrap">
                {/* Left Column: Visual Diamond */}
                <Stack align="center" gap="xs">
                    <DiamondView runners={occupiedBases} withTitle={false} />
                </Stack>

                {/* Right Column: Runners List & Stats */}
                <Stack gap="sm" pl="xs">
                    {(runsScored > 0 || outsRecorded > 0) && (
                        <Group gap="xs">
                            {runsScored > 0 && (
                                <Badge size="md" color="blue">
                                    {runsScored} RBI
                                    {runsScored > 1 ? "s" : ""}
                                </Badge>
                            )}
                            {outsRecorded > 0 && (
                                <Badge size="md" color="red">
                                    {outsRecorded} OUT
                                    {outsRecorded > 1 ? "S" : ""}
                                </Badge>
                            )}
                        </Group>
                    )}

                    {(runsScored > 0 || outsRecorded > 0) && <Divider />}

                    <Stack gap="xs">
                        <Text size="xs" fw={700} c="dimmed">
                            PROJECTED RUNNERS
                        </Text>
                        {[
                            { base: "third", label: "3rd" },
                            { base: "second", label: "2nd" },
                            { base: "first", label: "1st" },
                        ].map((b) => (
                            <Group
                                key={b.base}
                                justify="space-between"
                                wrap="nowrap"
                            >
                                <Badge
                                    variant="filled"
                                    color="gray"
                                    size="sm"
                                    w={40}
                                >
                                    {b.label}
                                </Badge>
                                <Text size="sm" fw={500} truncate>
                                    {getPlayerName(projectedRunners[b.base])}
                                </Text>
                            </Group>
                        ))}
                    </Stack>
                </Stack>
            </Group>

            <RunnerPanel
                actionType={actionType}
                runners={runners}
                outs={outs}
                runnerResults={runnerResults}
                setRunnerResults={setRunnerResults}
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
