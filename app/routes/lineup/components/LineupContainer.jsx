import { useFetcher } from "react-router";

import { Box, Button, Card, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import {
    IconArrowBackUp,
    IconBellRinging,
    IconDeviceFloppy,
} from "@tabler/icons-react";

import { getGameDayStatus } from "@/utils/dateTime";

import EditablePlayerChart from "./EditablePlayerChart";
import CreateLineupDrawer from "./CreateLineupDrawer";

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
    teams,
    onOpenAiDrawer,
    onOpenAddPlayers,
}) {
    const fetcher = useFetcher();
    const [createLineupOpened, createLineupHandlers] = useDisclosure(false);

    // Get the team data for ideal lineup/positioning
    const team = teams?.[0] || game?.team;

    const availablePlayers = players?.filter(
        (p) => p.availability === "accepted" || p.availability === "tentative",
    );

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

    const handleSaveAndPublish = () => {
        try {
            const formData = new FormData();
            formData.append("_action", "finalize-chart");
            formData.append("playerChart", JSON.stringify(lineupState));

            fetcher.submit(formData, {
                method: "post",
                action: `/events/${game.$id}/lineup`,
            });

            setHasBeenEdited(false);
        } catch (error) {
            console.error("Error finalizing lineup:", error);
        }
    };

    // NOTE: Uses an algorithm I created to generate a lineup and fielding chart
    // Team-level idealLineup and idealPositioning take precedence over player preferences
    const handleCreateWithAvailable = () => {
        const batting = createBattingOrder(availablePlayers, {
            idealLineup: team?.idealLineup,
        });

        if (batting?.length > 0) {
            const fieldingChart = createFieldingChart(batting, {
                idealPositioning: team?.idealPositioning,
            });

            if (fieldingChart?.length > 0) {
                lineupHandlers.setState(fieldingChart);
            }

            handleOnSave(fieldingChart);
        }
        createLineupHandlers.close();
    };

    const handleStartFromScratch = () => {
        lineupHandlers.setState([]);
        handleOnSave([]);
        createLineupHandlers.close();
        onOpenAddPlayers();
    };

    const handleOpenAiDrawer = () => {
        createLineupHandlers.close();
        onOpenAiDrawer();
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
                        <Button onClick={createLineupHandlers.open} fullWidth>
                            Create Lineup
                        </Button>
                        <CreateLineupDrawer
                            opened={createLineupOpened}
                            onClose={createLineupHandlers.close}
                            availablePlayers={availablePlayers}
                            onStartFromScratch={handleStartFromScratch}
                            onCreateWithAvailable={handleCreateWithAvailable}
                            onOpenAiDrawer={handleOpenAiDrawer}
                        />
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

    if (lineupState.length === 0) {
        return (
            <>
                {managerView ? (
                    <Button onClick={onOpenAddPlayers} fullWidth>
                        Add Players to Lineup
                    </Button>
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

    const publishButtonProps = {
        disabled: fetcher.state === "loading" || !lineupState?.length,
        loading: fetcher.state === "loading",
        loaderProps: { type: "dots" },
    };

    // Check if game is in the past
    const isGameInPast = game?.gameDate
        ? getGameDayStatus(game.gameDate) === "past"
        : false;

    const actionButtons = managerView && (
        <Group align="flex-end" gap="sm">
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
                variant="light"
            >
                Save
            </Button>
            {!isGameInPast && (
                <Button
                    {...publishButtonProps}
                    color="lime"
                    leftSection={<IconBellRinging size={18} />}
                    onClick={handleSaveAndPublish}
                    variant="filled"
                >
                    {hasBeenEdited ? "Save & Publish" : "Publish"}
                </Button>
            )}
        </Group>
    );

    return (
        <>
            {lineupState?.length > 0 && (
                <>
                    <Group
                        justify="space-between"
                        align="center"
                        mb="md"
                        visibleFrom="sm"
                    >
                        <Text size="sm" c="dimmed">
                            {lineupState.length} players in lineup
                        </Text>
                        {actionButtons}
                    </Group>

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
                        <Box hiddenFrom="sm">
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
                                    variant="light"
                                >
                                    Save
                                </Button>
                            </Group>
                            {!isGameInPast && (
                                <Button
                                    {...publishButtonProps}
                                    fullWidth
                                    color="lime"
                                    leftSection={<IconBellRinging size={18} />}
                                    onClick={handleSaveAndPublish}
                                    variant="filled"
                                >
                                    {hasBeenEdited
                                        ? "Save & Publish"
                                        : "Publish"}
                                </Button>
                            )}
                        </Box>
                    )}
                </>
            )}
        </>
    );
}
