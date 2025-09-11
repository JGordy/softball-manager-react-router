import { useState } from "react";
import { useFetcher } from "react-router";

import { Alert, Button, Card, Checkbox, Group, Text } from "@mantine/core";
import { useDisclosure, useListState } from "@mantine/hooks";

import {
    IconArrowBackUp,
    IconDeviceFloppy,
    IconInfoCircle,
    IconPlus,
    // IconTrashX,
} from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer";
import EditablePlayerChart from "@/components/EditablePlayerChart";

import createBattingOrder from "../utils/createBattingOrder";
import createFieldingChart from "../utils/createFieldingChart";

export default function LineupContainer({
    game,
    managerView,
    playerChart,
    players,
}) {
    const fetcher = useFetcher();

    const [addPlayersDrawerOpened, addPlayersHandlers] = useDisclosure(false);
    const [selectedPlayers, setSelectedPlayers] = useState([]);

    const [hasBeenEdited, setHasBeenEdited] = useState(false);

    const [listState, handlers] = useListState(playerChart);

    const availablePlayers = players?.filter(
        (p) => p.availability === "accepted",
    );
    const probablePlayers = players?.filter((p) =>
        ["tentative", "noresponse"].includes(p.availability),
    );
    // console.log('/event/:eventId > LineupContainer: ', { availablePlayers, playerChart, parsedChart, listState, players });

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
            formData.append("playerChart", JSON.stringify(chart || listState));

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
        handlers.setState(playerChart);
        setHasBeenEdited(false);
    };

    // const handleDeleteChart = () => {
    //     handlers.setState(null);
    //     setHasBeenEdited(false);

    //     try {
    //         const formData = new FormData();
    //         formData.append('_action', 'save-chart');
    //         formData.append('playerChart', null);

    //         fetcher.submit(formData, { method: 'post', action: `/events/${game.$id}/lineup` });
    //     } catch (error) {
    //         console.error('Error deleting attendance form:', error);
    //     }
    // };

    // NOTE: Uses an algorithim I created to generate a lineup and fielding chart
    const handleCreateCharts = () => {
        if (hasEnoughPlayers) {
            const batting = createBattingOrder(availablePlayers);

            if (batting?.length > 0) {
                const fieldingChart = createFieldingChart(batting);

                if (fieldingChart?.length > 0) {
                    handlers.setState(fieldingChart);
                }

                handleOnSave(fieldingChart);
            }
        }
    };

    // NOTE: For generative AI to output in a json format
    // const handleGenerateCharts = () => {
    // NOTE: Example data
    // try {
    //     const formData = new FormData();
    //     formData.append('_action', 'create-attendance');
    //     formData.append('team', JSON.stringify(team));
    //     formData.append('gameDate', gameDate);
    //     formData.append('opponent', opponent);
    //     formData.append('gameId', gameId);

    //     fetcher.submit(formData, { method: 'post', action: `/events/${gameId}` }); // Use fetcher.submit
    // } catch (error) {
    //     console.error('Error submitting attendance form:', error);
    // }
    // };

    const handleEditChart = (position, playerId, inning) => {
        const playerIndex = listState.findIndex((p) => p.$id === playerId);

        if (playerIndex === -1) {
            return; // Or handle the case where the player is not found
        }

        const playerToUpdate = listState[playerIndex];
        const inningIndex = parseInt(inning.replace("inning", ""), 10) - 1;

        const updatedPositions = [...playerToUpdate.positions];
        updatedPositions[inningIndex] = position;

        handlers.setItemProp(playerIndex, "positions", updatedPositions);

        setHasBeenEdited(true);
    };

    if (!listState) {
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
        return handlers.reorder({
            from: source.index,
            to: destination?.index || 0,
        });
    };

    const handleAddPlayer = () => {
        const playersToAdd = players.reduce((acc, player) => {
            if (selectedPlayers.includes(player.$id)) {
                acc.push({
                    $id: player.$id,
                    firstName: player.firstName,
                    lastName: player.lastName,
                    gender: player.gender,
                    preferredPositions: player.preferredPositions || [],
                    dislikedPositions: player.dislikedPositions || [],
                    positions: [],
                });
            }
            return acc;
        }, []);
        console.log({ playersToAdd });
        handlers.append(...playersToAdd);
        setSelectedPlayers([]);
        addPlayersHandlers.close();
        setHasBeenEdited(true);
    };

    const handleRemovePlayer = (playerIdToRemove) => {
        const indexToRemove = listState.findIndex(
            (player) => player.$id === playerIdToRemove,
        );
        if (indexToRemove !== -1) {
            handlers.remove(indexToRemove);
            setHasBeenEdited(true);
        }
    };

    const buttonProps = {
        disabled: fetcher.state === "loading" || !hasBeenEdited,
        loading: fetcher.state === "loading",
        loaderProps: { type: "dots" },
    };

    return (
        <>
            {listState && (
                <>
                    <Card p="sm" radius="lg">
                        <EditablePlayerChart
                            setPlayerChart={handleEditChart}
                            handleRemovePlayer={handleRemovePlayer}
                            playerChart={listState}
                            managerView={managerView}
                            handleLineupReorder={handleLineupReorder}
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
                                {/* <Button
                                    {...buttonProps}
                                    color="red"
                                    leftSection={<IconTrashX size={18} />}
                                    onClick={handleDeleteChart}
                                    variant="light"
                                >
                                    Delete
                                </Button> */}
                                <Button
                                    {...buttonProps}
                                    color="green"
                                    disabled={fetcher.state === "loading"}
                                    leftSection={<IconPlus size={18} />}
                                    onClick={addPlayersHandlers.open}
                                    variant="light"
                                >
                                    Add Players
                                </Button>
                            </Group>
                            <Button
                                {...buttonProps}
                                leftSection={<IconDeviceFloppy size={18} />}
                                onClick={() => handleOnSave()}
                                fullWidth
                            >
                                Save Changes
                            </Button>
                        </>
                    )}
                </>
            )}
            {managerView && (
                <DrawerContainer
                    title="Add Players to Lineup"
                    opened={addPlayersDrawerOpened}
                    onClose={addPlayersHandlers.close}
                >
                    <Checkbox.Group
                        value={selectedPlayers}
                        onChange={setSelectedPlayers}
                    >
                        <div mt="xs">
                            {probablePlayers.map((player) => (
                                <Card key={player.$id} p="0" mb="sm">
                                    <Checkbox.Card
                                        radius="md"
                                        p="sm"
                                        value={player.$id}
                                    >
                                        <Group wrap="nowrap" align="center">
                                            <Checkbox.Indicator />
                                            <div>
                                                <Text>
                                                    {player.firstName}{" "}
                                                    {player.lastName}
                                                </Text>
                                            </div>
                                        </Group>
                                    </Checkbox.Card>
                                </Card>
                            ))}
                        </div>
                    </Checkbox.Group>
                    <Button onClick={handleAddPlayer} mt="md" fullWidth>
                        Add Selected Players
                    </Button>
                </DrawerContainer>
            )}
        </>
    );
}
