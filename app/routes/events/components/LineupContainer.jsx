import { useFetcher } from "react-router";

import { Alert, Button, Card, Group, Text } from "@mantine/core";

import {
    IconArrowBackUp,
    IconDeviceFloppy,
    IconInfoCircle,
} from "@tabler/icons-react";

import EditablePlayerChart from "./EditablePlayerChart";

import createBattingOrder from "../utils/createBattingOrder";
import createFieldingChart from "../utils/createFieldingChart";

export default function LineupContainer({
    game,
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

    const availablePlayers = players?.filter(
        (p) => p.availability === "accepted",
    );
    // console.log('/event/:eventId > LineupContainer: ', { availablePlayers, lineupState, players });

    // NOTE: Most leagues require at least 8 players in the field to allow the teams to take the field
    // TODO: Add a database field for minimum number of players?
    const hasEnoughPlayers = availablePlayers?.length > 7;

    let message =
        "Charts for this game have not yet been created. You can create them below.";

    if (!hasEnoughPlayers) {
        message = `There aren't enough available players to create a lineup. A minimum of 8 players is required (${availablePlayers.length} available).`;
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
                action: `/events/${game.$id}/lineup`,
            });

            setHasBeenEdited(false);
        } catch (error) {
            console.error("Error submitting attendance form:", error);
        }
    };

    const handleResetChart = () => {
        lineupHandlers.setState(playerChart);
        setHasBeenEdited(false);
    };

    // NOTE: Uses an algorithm I created to generate a lineup and fielding chart
    const handleCreateCharts = () => {
        if (hasEnoughPlayers) {
            const batting = createBattingOrder(availablePlayers);

            if (batting?.length > 0) {
                const fieldingChart = createFieldingChart(batting);

                if (fieldingChart?.length > 0) {
                    lineupHandlers.setState(fieldingChart);
                }

                handleOnSave(fieldingChart);
            }
        }
    };

    const handleEditChart = (position, playerId, inning) => {
        const playerIndex = lineupState.findIndex((p) => p.$id === playerId);

        if (playerIndex === -1) {
            return; // Or handle the case where the player is not found
        }

        const playerToUpdate = lineupState[playerIndex];
        const inningIndex = parseInt(inning.replace("inning", ""), 10) - 1;

        const updatedPositions = [...playerToUpdate.positions];
        updatedPositions[inningIndex] = position;

        lineupHandlers.setItemProp(playerIndex, "positions", updatedPositions);

        setHasBeenEdited(true);
    };

    if (!lineupState) {
        return (
            <>
                {managerView ? (
                    <>
                        <Alert
                            title={
                                hasEnoughPlayers
                                    ? "Charts not yet created"
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
                                Create Batting and Fielding Charts
                            </Button>
                        )}
                    </>
                ) : (
                    <Text>
                        Batting Lineup and Fielding Chart have not yet been
                        created. Come back later.
                    </Text>
                )}
            </>
        );
    }

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

    return (
        <>
            {lineupState?.length > 0 && (
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
                        <>
                            <Group justify="space-between" my="lg" grow>
                                <Button
                                    {...buttonProps}
                                    color="blue"
                                    leftSection={<IconArrowBackUp size={18} />}
                                    onClick={handleResetChart}
                                    variant="light"
                                >
                                    Reset
                                </Button>
                                <Button
                                    {...buttonProps}
                                    leftSection={<IconDeviceFloppy size={18} />}
                                    onClick={() => handleOnSave(lineupState)}
                                >
                                    Save Changes
                                </Button>
                            </Group>
                        </>
                    )}
                </>
            )}
        </>
    );
}
