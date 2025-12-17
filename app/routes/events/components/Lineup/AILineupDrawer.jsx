import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import Markdown from "react-markdown";

import { Button, Card, Group, Stack, Text, Alert, Tabs } from "@mantine/core";

import { IconSparkles, IconCheck, IconInfoCircle } from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer";
import TabsWrapper from "@/components/TabsWrapper";

import markdownStyles from "@/styles/markdown.module.css";

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

    // Manage loading text based on fetcher state
    useEffect(() => {
        if (isLoading) {
            setLoadingText("Putting the finishing touches on your roster...");
        } else if (isSubmitting) {
            // Cycle through loading messages every 3 seconds
            let messageIndex = 0;
            setLoadingText(LOADING_MESSAGES[0]);

            const interval = setInterval(() => {
                messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
                setLoadingText(LOADING_MESSAGES[messageIndex]);
            }, 5000);

            return () => clearInterval(interval);
        } else {
            setLoadingText(null);
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
            onClose();
            setAiError(null);
        }
    };

    // Close drawer and reset state
    const handleClose = () => {
        onClose();
        setAiError(null);
        // Keep generated lineup visible if user closes and reopens
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
                        {loadingText && (
                            <Text
                                size="sm"
                                variant="gradient"
                                gradient={{ from: "blue", to: "cyan", deg: 90 }}
                                ta="center"
                                mt="md"
                            >
                                {loadingText}
                            </Text>
                        )}
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
