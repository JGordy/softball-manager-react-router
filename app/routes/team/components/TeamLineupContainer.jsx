import { useFetcher } from "react-router";

import { Alert, Button, Card, Group, Text } from "@mantine/core";

import {
    IconArrowBackUp,
    IconDeviceFloppy,
    IconInfoCircle,
} from "@tabler/icons-react";

import EditablePlayerChart from "@/components/EditablePlayerChart";

import createBattingOrder from "@/routes/events/utils/createBattingOrder";
import createFieldingChart from "@/routes/events/utils/createFieldingChart";

export default function TeamLineupContainer({
    team,
    managerView,
    playerChart,
    players,
    lineupState,
    lineupHandlers,
    hasBeenEdited,
    setHasBeenEdited,
    validationResults,
}) {
    const fetcher = useFetcher();

    // Ideally for a team "ideal lineup", we consider all active players available.
    // If you have a specific "active" status, filter by that. For now, using all players.
    const availablePlayers = players;

    // A minimum of 8 players is usually required to make a meaningful chart
    const hasEnoughPlayers = availablePlayers?.length > 7;

    let message = "Ideal lineup has not yet been set. You can create it below.";

    if (!hasEnoughPlayers) {
        message = `There aren't enough players to create a lineup. A minimum of 8 players is required (${availablePlayers?.length || 0} available).`;
    }

    const handleOnSave = (chart) => {
        try {
            const formData = new FormData();
            formData.append("_action", "save-chart");
            formData.append(
                "playerChart",
                JSON.stringify(chart || lineupState),
            );

            fetcher.submit(formData, {
                method: "post",
                action: `/team/${team.$id}/lineup`,
            });

            setHasBeenEdited(false);
        } catch (error) {
            console.error("Error submitting lineup form:", error);
        }
    };

    const handleResetChart = () => {
        lineupHandlers.setState(playerChart);
        setHasBeenEdited(false);
    };

    // Reuse the existing algorithm logic
    const handleCreateCharts = () => {
        if (hasEnoughPlayers) {
            const batting = createBattingOrder(availablePlayers);

            if (batting?.length > 0) {
                const fieldingChart = createFieldingChart(batting);

                if (fieldingChart?.length > 0) {
                    lineupHandlers.setState(fieldingChart);
                }

                // Auto-save on initial creation if desired, or let user save.
                // Letting user save is safer so they can tweak it first.
                setHasBeenEdited(true);
            }
        }
    };

    const handleEditChart = (position, playerId, inning) => {
        const playerIndex = lineupState.findIndex((p) => p.$id === playerId);

        if (playerIndex === -1) {
            return;
        }

        const playerToUpdate = lineupState[playerIndex];
        const inningIndex = parseInt(inning.replace("inning", ""), 10) - 1;

        const updatedPositions = [...playerToUpdate.positions];
        updatedPositions[inningIndex] = position;

        lineupHandlers.setItemProp(playerIndex, "positions", updatedPositions);

        setHasBeenEdited(true);
    };

    const handleLineupReorder = ({ destination, source }) => {
        if (destination.index !== source.index) {
            setHasBeenEdited(true);
        }
        return lineupHandlers.reorder({
            from: source.index,
            to: destination?.index || 0,
        });
    };

    const buttonProps = {
        disabled: fetcher.state === "loading" || !hasBeenEdited,
        loading: fetcher.state === "loading",
        loaderProps: { type: "dots" },
    };

    if (!lineupState || lineupState.length === 0) {
        return (
            <>
                {managerView ? (
                    <>
                        <Alert
                            title={
                                hasEnoughPlayers
                                    ? "Ideal Lineup not yet set"
                                    : "Not enough players"
                            }
                            variant="light"
                            color={hasEnoughPlayers ? "yellow" : "red"}
                            icon={<IconInfoCircle size={18} />}
                        >
                            {message}
                        </Alert>
                        {hasEnoughPlayers && (
                            <Button
                                mt="sm"
                                onClick={handleCreateCharts}
                                fullWidth
                            >
                                Generate Initial Lineup & Fielding Chart
                            </Button>
                        )}
                    </>
                ) : (
                    <Text>
                        Ideal Batting Lineup and Fielding Chart have not yet
                        been set by the manager.
                    </Text>
                )}
            </>
        );
    }

    return (
        <>
            <Card p="sm" radius="lg">
                <EditablePlayerChart
                    setPlayerChart={handleEditChart}
                    playerChart={lineupState}
                    players={players}
                    managerView={managerView}
                    handleLineupReorder={handleLineupReorder}
                    validationResults={validationResults}
                />
            </Card>

            {managerView && (
                <Group justify="space-between" my="lg" grow>
                    <Button
                        {...buttonProps}
                        color="blue"
                        leftSection={<IconArrowBackUp size={18} />}
                        onClick={handleResetChart}
                        variant="light"
                    >
                        Reset Changes
                    </Button>
                    <Button
                        {...buttonProps}
                        leftSection={<IconDeviceFloppy size={18} />}
                        onClick={() => handleOnSave(lineupState)}
                    >
                        Save Ideal Lineup
                    </Button>
                </Group>
            )}
        </>
    );
}
