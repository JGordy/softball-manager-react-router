import { useState } from "react";
import { useFetcher } from "react-router";
import Markdown from "react-markdown";

import {
    Button,
    Checkbox,
    Card,
    Divider,
    Group,
    Stack,
    Text,
    Alert,
    Tabs,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import {
    IconUserPlus,
    IconUserMinus,
    IconTrashX,
    IconCircleCheckFilled,
    IconSquareXFilled,
    IconHelpTriangleFilled,
    IconMessageCircleOff,
    IconSparkles,
    IconCheck,
    IconInfoCircle,
} from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer";
import MenuContainer from "@/components/MenuContainer";
import TabsWrapper from "@/components/TabsWrapper";

import markdownStyles from "@/styles/markdown.module.css";

const availabilityData = {
    accepted: {
        icon: <IconCircleCheckFilled size={18} color="green" />,
        label: "Accepted",
        order: 0,
    },
    tentative: {
        icon: <IconHelpTriangleFilled size={18} color="orange" />,
        label: "Tentative",
        order: 1,
    },
    declined: {
        icon: <IconSquareXFilled size={18} color="red" />,
        label: "Declined",
        order: 2,
    },
    unknown: {
        icon: <IconMessageCircleOff size={18} color="gray" />,
        label: "Unknown",
        order: 3,
    },
};

export default function LineupMenu({
    game,
    team,
    actionUrl,
    lineupState,
    lineupHandlers,
    playersNotInLineup,
    players,
    setHasBeenEdited,
}) {
    const fetcher = useFetcher();
    const aiFetcher = useFetcher();

    const [addPlayersDrawerOpened, addPlayersHandlers] = useDisclosure(false);
    const [selectedPlayers, setSelectedPlayers] = useState([]);

    const renderGroupedPlayers = () => {
        // Group players by availability status
        const grouped = (playersNotInLineup ?? []).reduce((acc, player) => {
            const status = player.availability || "unknown";
            if (!acc[status]) acc[status] = [];
            acc[status].push(player);
            return acc;
        }, {});

        // Sort each group alphabetically
        Object.keys(grouped).forEach((status) => {
            grouped[status].sort((a, b) =>
                `${a.lastName} ${a.firstName}`.localeCompare(
                    `${b.lastName} ${b.firstName}`,
                ),
            );
        });

        // Render groups in order
        return Object.keys(availabilityData).map((status) => {
            const players = grouped[status];
            if (!players || players.length === 0) return null;

            return (
                <div key={status} style={{ marginBottom: 16 }}>
                    <Group gap="xs" mb="xs">
                        {availabilityData[status].icon}
                        <Text fw={700} size="sm" c="dimmed">
                            {availabilityData[status].label} ({players.length})
                        </Text>
                    </Group>
                    <Stack gap="xs">
                        {players.map((player) => (
                            <Card key={player.$id} p="0">
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
                    </Stack>
                    {status !== "unknown" && <Divider mt="md" />}
                </div>
            );
        });
    };

    const handleAddPlayer = () => {
        const playersToAdd = (playersNotInLineup ?? []).reduce(
            (acc, player) => {
                if (
                    selectedPlayers.includes(player.$id) &&
                    !lineupState.some((lp) => lp.$id === player.$id)
                ) {
                    acc.push({
                        $id: player.$id,
                        firstName: player.firstName,
                        lastName: player.lastName,
                        gender: player.gender,
                        positions: [],
                    });
                }
                return acc;
            },
            [],
        );

        lineupHandlers.append(...playersToAdd);
        setSelectedPlayers([]);
        setHasBeenEdited(true);
        addPlayersHandlers.close();
    };

    const [removePlayersDrawerOpened, removePlayersHandlers] =
        useDisclosure(false);
    const handleRemovePlayers = (playerIdsToRemove) => {
        // Collect indices to remove
        const indicesToRemove = playerIdsToRemove
            .map((playerId) =>
                lineupState.findIndex((player) => player.$id === playerId),
            )
            .filter((index) => index !== -1);
        // Sort indices descending to avoid index shifting
        indicesToRemove
            .sort((a, b) => b - a)
            .forEach((index) => {
                lineupHandlers.remove(index);
            });
        setHasBeenEdited(true);
        setSelectedPlayers([]);
        removePlayersHandlers.close();
    };

    const [deleteChartDrawerOpened, deleteChartHandlers] = useDisclosure(false);
    const handleDeleteChart = () => {
        lineupHandlers.setState(null);

        try {
            const formData = new FormData();
            formData.append("_action", "save-chart");
            formData.append("playerChart", JSON.stringify(null));

            fetcher.submit(formData, {
                method: "post",
                action: actionUrl,
            });
        } catch (error) {
            console.error(
                `Error deleting chart${game ? ` for game ${game.$id}` : ""}:`,
                error,
            );
        }

        setHasBeenEdited(false);
        deleteChartHandlers.close();
    };

    // AI lineup generation
    const [aiGenerateDrawerOpened, aiGenerateHandlers] = useDisclosure(false);
    const [aiError, setAiError] = useState(null);
    const [generatedLineup, setGeneratedLineup] = useState(null);
    const [aiReasoning, setAiReasoning] = useState(null);

    const handleGenerateAILineup = async () => {
        setAiError(null);

        try {
            // Use players who have accepted or are tentative
            const availablePlayers = players?.filter(
                (p) =>
                    p.availability === "accepted" ||
                    p.availability === "tentative",
            );

            if (!availablePlayers || availablePlayers.length < 10) {
                setAiError(
                    "Need at least 10 available players to generate a lineup",
                );
                return;
            }

            aiFetcher.submit(
                JSON.stringify({
                    players: availablePlayers,
                    team: {
                        $id: team.$id,
                        name: team.name,
                        genderMix: team.genderMix,
                        idealLineup: team.idealLineup,
                        idealPositioning: team.idealPositioning,
                    },
                    gameId: game?.$id,
                }),
                {
                    method: "POST",
                    action: "/api/lineup",
                    encType: "application/json",
                },
            );
        } catch (error) {
            console.error("Error generating AI lineup:", error);
            setAiError(error.message || "Failed to generate lineup");
        }
    };

    // Handle AI fetcher response - store in local state instead of applying immediately
    if (aiFetcher.data && !aiFetcher.data.error && aiFetcher.state === "idle") {
        if (aiFetcher.data.lineup && !generatedLineup) {
            setGeneratedLineup(aiFetcher.data.lineup);
            setAiReasoning(aiFetcher.data.reasoning || null);
        }
    }

    // Handle AI fetcher error
    if (aiFetcher.data?.error && aiFetcher.state === "idle") {
        if (!aiError) {
            setAiError(aiFetcher.data.error);
        }
    }

    // Apply the generated lineup to the actual lineup state
    const handleApplyGeneratedLineup = () => {
        if (generatedLineup) {
            lineupHandlers.setState(generatedLineup);
            setHasBeenEdited(true);
            setGeneratedLineup(null);
            setAiReasoning(null);
            aiGenerateHandlers.close();
            setAiError(null);
        }
    };

    // Close drawer and reset generated lineup
    const handleCloseAIDrawer = () => {
        aiGenerateHandlers.close();
        setAiError(null);
        // Don't clear generated lineup immediately to allow user to review
        // setTimeout(() => setGeneratedLineup(null), 300); // Clear after drawer closes
    };

    const lineupItems = [];

    // AI Generation - always show if we have players
    if (players && players.length > 0) {
        lineupItems.push({
            key: "generate-ai-lineup",
            onClick: aiGenerateHandlers.open,
            leftSection: <IconSparkles size={20} />,
            content: <Text>Generate AI Lineup</Text>,
        });
    }

    // Only show Add/Remove Players if there's a player chart
    if (lineupState && lineupState.length > 0) {
        lineupItems.push(
            {
                key: "add-players",
                onClick: addPlayersHandlers.open,
                leftSection: <IconUserPlus size={20} />,
                content: <Text>Add Players</Text>,
            },
            {
                key: "remove-players",
                onClick: removePlayersHandlers.open,
                leftSection: <IconUserMinus size={20} />,
                content: <Text>Remove Players</Text>,
            },
        );
    }

    const sections = [
        ...(lineupItems.length > 0
            ? [
                  {
                      label: "Lineup",
                      items: lineupItems,
                  },
              ]
            : []),
        {
            label: "Danger Zone",
            items: [
                {
                    key: "delete-chart",
                    color: "red",
                    onClick: deleteChartHandlers.open,
                    leftSection: <IconTrashX size={20} />,
                    content: <Text>Delete Chart</Text>,
                },
            ],
        },
    ];

    return (
        <>
            <MenuContainer sections={sections} />

            <DrawerContainer
                title="Add Players to Lineup"
                opened={addPlayersDrawerOpened}
                onClose={addPlayersHandlers.close}
                size="xl"
            >
                <Checkbox.Group
                    value={selectedPlayers}
                    onChange={setSelectedPlayers}
                >
                    {renderGroupedPlayers()}
                </Checkbox.Group>
                <Button
                    onClick={handleAddPlayer}
                    mt="md"
                    fullWidth
                    disabled={selectedPlayers.length === 0}
                >
                    Add Selected Players
                </Button>
            </DrawerContainer>

            <DrawerContainer
                title="Remove Players from Lineup"
                opened={removePlayersDrawerOpened}
                onClose={removePlayersHandlers.close}
                size="xl"
            >
                <Checkbox.Group
                    value={selectedPlayers}
                    onChange={setSelectedPlayers}
                >
                    <div mt="xs">
                        {lineupState?.map((player) => (
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
                <Button
                    color="red"
                    onClick={() => handleRemovePlayers(selectedPlayers)}
                    mt="md"
                    fullWidth
                    disabled={selectedPlayers.length === 0}
                >
                    Remove Selected Players
                </Button>
            </DrawerContainer>

            <DrawerContainer
                title="Delete Lineup"
                opened={deleteChartDrawerOpened}
                onClose={deleteChartHandlers.close}
            >
                <Text>Are you sure you want to delete this lineup?</Text>
                <Text c="red">This action cannot be undone.</Text>
                <Group justify="space-between" mt="xl" grow>
                    <Button
                        variant="filled"
                        onClick={deleteChartHandlers.close}
                    >
                        No, Cancel
                    </Button>
                    <Button
                        variant="outline"
                        color="red"
                        onClick={handleDeleteChart}
                    >
                        Yes, Delete Lineup
                    </Button>
                </Group>
            </DrawerContainer>

            <DrawerContainer
                title="Generate AI Lineup"
                opened={aiGenerateDrawerOpened}
                onClose={handleCloseAIDrawer}
                size="xl"
            >
                {!generatedLineup ? (
                    <Stack>
                        <Text>
                            This will use AI to generate an optimal batting
                            order and fielding chart based on manager & player
                            preferences and league rules.
                        </Text>
                        <Text size="sm" c="dimmed">
                            Only players who have accepted or are tentative will
                            be included in the lineup.
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
                            <Button
                                variant="subtle"
                                onClick={handleCloseAIDrawer}
                            >
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
                                onClick={handleGenerateAILineup}
                                loading={
                                    aiFetcher.state === "submitting" ||
                                    aiFetcher.state === "loading"
                                }
                                leftSection={<IconSparkles size={18} />}
                            >
                                Generate Lineup
                            </Button>
                        </Group>
                    </Stack>
                ) : (
                    <>
                        <TabsWrapper defaultValue="lineup" mt="0">
                            <Tabs.Tab value="lineup">Lineup</Tabs.Tab>
                            <Tabs.Tab value="reasoning">AI Analysis</Tabs.Tab>

                            <Tabs.Panel value="lineup" pt="md">
                                <Alert
                                    icon={<IconCheck size={16} />}
                                    title="Lineup Generated!"
                                    color="green"
                                    mb="md"
                                >
                                    AI has generated a lineup with{" "}
                                    {generatedLineup.length} players. Review it
                                    below, then click "Apply Lineup" to use it.
                                </Alert>

                                <Card withBorder p="md">
                                    <Text fw={700} size="sm" mb="xs">
                                        Batting Order Preview
                                    </Text>
                                    <Stack gap="xs">
                                        {generatedLineup.map(
                                            (player, index) => (
                                                <Group
                                                    key={player.$id}
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
                                                        {player.firstName}{" "}
                                                        {player.lastName}
                                                    </Text>
                                                    <Text
                                                        size="xs"
                                                        c="dimmed"
                                                        ml="auto"
                                                    >
                                                        ({player.gender})
                                                    </Text>
                                                </Group>
                                            ),
                                        )}
                                    </Stack>
                                </Card>

                                <Text size="sm" c="dimmed" mt="md">
                                    The fielding positions for each inning have
                                    also been assigned. You can review and edit
                                    them after applying.
                                </Text>
                            </Tabs.Panel>

                            <Tabs.Panel value="reasoning" pt="md">
                                {aiReasoning ? (
                                    <Card
                                        withBorder
                                        p="md"
                                        bg="var(--mantine-color-blue-light)"
                                    >
                                        <Text fw={700} size="sm" mb="md">
                                            AI Analysis
                                        </Text>
                                        <div
                                            className={markdownStyles.markdown}
                                        >
                                            <Markdown>{aiReasoning}</Markdown>
                                        </div>
                                    </Card>
                                ) : (
                                    <Text c="dimmed" size="sm">
                                        No reasoning provided.
                                    </Text>
                                )}
                            </Tabs.Panel>
                        </TabsWrapper>

                        <Group justify="space-between" mt="xl">
                            <Button
                                variant="subtle"
                                onClick={() => {
                                    setGeneratedLineup(null);
                                    setAiReasoning(null);
                                    setAiError(null);
                                }}
                            >
                                Regenerate
                            </Button>
                            <Button
                                style={{ flexGrow: 1 }}
                                variant="filled"
                                color="green"
                                onClick={handleApplyGeneratedLineup}
                                leftSection={<IconCheck size={18} />}
                            >
                                Apply Lineup
                            </Button>
                        </Group>
                    </>
                )}
            </DrawerContainer>
        </>
    );
}
