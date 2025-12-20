import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import Markdown from "react-markdown";

import { Button, Card, Group, Stack, Text, Alert, Tabs } from "@mantine/core";

import { IconSparkles, IconCheck, IconInfoCircle } from "@tabler/icons-react";

import { trackEvent } from "@/utils/analytics";

import DrawerContainer from "@/components/DrawerContainer";
import TabsWrapper from "@/components/TabsWrapper";

import markdownStyles from "@/styles/markdown.module.css";

// Need at least 10 players to fill all fielding positions and generate a meaningful batting order
const MIN_PLAYERS_FOR_AI_LINEUP = 10;

const LOADING_MESSAGES = [
    "AI is warming up in the bullpen to generate your lineup...",
    "The AI coach is crunching the stats for your winning lineup...",
    "Our AI coach is debating the cleanup hitter...",
    "Setting the field... AI is finding your best batting order.",
    "Analyzing the roster... Great lineups take a second to build.",
    "Rounding the bases... your lineup is almost ready.",
];

export default function AILineupDrawer({
    opened,
    onClose,
    game,
    team,
    players,
    lineupHandlers,
    setHasBeenEdited,
}) {
    const aiFetcher = useFetcher();
    const isSubmitting = aiFetcher.state === "submitting";
    const isLoading = aiFetcher.state === "loading";
    const showLoading = isSubmitting || isLoading;

    const [aiError, setAiError] = useState(null);
    const [generatedLineup, setGeneratedLineup] = useState(null);
    const [loadingText, setLoadingText] = useState(null);
    const [aiReasoning, setAiReasoning] = useState(null);
    const [loadingInterval, setLoadingInterval] = useState(null);

    // Manage loading text based on fetcher state
    useEffect(() => {
        if (isLoading) {
            setLoadingText("Putting the finishing touches on your roster...");
        } else if (isSubmitting) {
            // Cycle through loading messages every 5 seconds
            let messageIndex = 0;
            setLoadingText(LOADING_MESSAGES[0]);

            const interval = setInterval(() => {
                messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
                setLoadingText(LOADING_MESSAGES[messageIndex]);
            }, 5000);

            setLoadingInterval(interval);
            return () => clearInterval(interval);
        } else {
            setLoadingText(null);
            if (loadingInterval) {
                clearInterval(loadingInterval);
                setLoadingInterval(null);
            }
        }
    }, [aiFetcher.state]);

    const handleGenerateAILineup = async () => {
        setAiError(null);

        try {
            // Use players who have accepted or are tentative
            const availablePlayers = players?.filter(
                (p) =>
                    p.availability === "accepted" ||
                    p.availability === "tentative",
            );

            if (
                !availablePlayers ||
                availablePlayers.length < MIN_PLAYERS_FOR_AI_LINEUP
            ) {
                setAiError(
                    `Need at least ${MIN_PLAYERS_FOR_AI_LINEUP} available players to generate a lineup`,
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
            trackEvent("ai-lineup-requested", {
                teamId: team.$id,
                gameId: game?.$id,
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error || "");

            if (process.env.NODE_ENV === "development") {
                console.error("Error generating AI lineup:", error);
            } else {
                console.error("Error generating AI lineup:", message);
            }

            const userMessage =
                process.env.NODE_ENV === "development"
                    ? message || "Failed to generate lineup"
                    : "Failed to generate lineup";

            setAiError(userMessage);
        }
    };

    // Handle AI fetcher response - store in local state instead of applying immediately
    useEffect(() => {
        if (aiFetcher.state !== "idle") {
            return;
        }

        // Successful AI response
        if (aiFetcher.data && !aiFetcher.data.error && !generatedLineup) {
            if (aiFetcher.data.lineup) {
                setGeneratedLineup(aiFetcher.data.lineup);
                setAiReasoning(aiFetcher.data.reasoning || null);
                trackEvent("ai-lineup-generated", {
                    teamId: team.$id,
                    gameId: game?.$id,
                });
            }
        }

        // AI error response
        if (aiFetcher.data?.error && !aiError) {
            setAiError(aiFetcher.data.error);
        }
    }, [aiFetcher.data, aiFetcher.state, generatedLineup, aiError]);

    // Apply the generated lineup to the actual lineup state
    const handleApplyGeneratedLineup = () => {
        if (generatedLineup) {
            lineupHandlers.setState(generatedLineup);
            setHasBeenEdited(true);
            setGeneratedLineup(null);
            setAiReasoning(null);
            onClose();
            setAiError(null);
            trackEvent("ai-lineup-applied", {
                teamId: team.$id,
                gameId: game?.$id,
            });
        }
    };

    // Close drawer and reset state (clear any generated lineup to avoid stale data)
    const handleClose = () => {
        // Clear any active loading interval to prevent memory leaks
        if (loadingInterval) {
            clearInterval(loadingInterval);
            setLoadingInterval(null);
        }
        onClose();
        setAiError(null);
        setGeneratedLineup(null);
        setAiReasoning(null);
    };

    const handleRegenerate = () => {
        setGeneratedLineup(null);
        setAiReasoning(null);
        setAiError(null);
    };

    return (
        <DrawerContainer
            title="Generate AI Lineup"
            opened={opened}
            onClose={handleClose}
            size="xl"
        >
            {!generatedLineup ? (
                <Stack>
                    <Text>
                        This will use AI to generate an optimal batting order
                        and fielding chart based on manager & player preferences
                        and league rules.
                    </Text>
                    <Text size="sm" c="dimmed">
                        Only players who have accepted or are tentative will be
                        included in the lineup.
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
                        <Button variant="subtle" onClick={handleClose}>
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
                            loading={showLoading}
                            leftSection={<IconSparkles size={18} />}
                        >
                            Generate Lineup
                        </Button>
                    </Group>
                    {loadingText && (
                        <Text
                            size="md"
                            variant="gradient"
                            gradient={{ from: "pink", to: "cyan", deg: 90 }}
                            ta="center"
                            mt="md"
                        >
                            {loadingText}
                        </Text>
                    )}
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
                                    {generatedLineup.map((player, index) => (
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
                                    ))}
                                </Stack>
                            </Card>

                            <Text size="sm" c="dimmed" mt="md">
                                The fielding positions for each inning have also
                                been assigned. You can review and edit them
                                after applying.
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
                                    <div className={markdownStyles.markdown}>
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
                        <Button variant="subtle" onClick={handleRegenerate}>
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
    );
}
