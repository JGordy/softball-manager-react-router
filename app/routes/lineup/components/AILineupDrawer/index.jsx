import { useState, useEffect } from "react";
import { useFetcher } from "react-router";

import { trackEvent } from "@/utils/analytics";

import DrawerContainer from "@/components/DrawerContainer";

import InitialView from "./InitialView";
import LoadingView from "./LoadingView";
import ResultsView from "./ResultsView";

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

    // Manage loading text based on fetcher state
    useEffect(() => {
        if (isLoading) {
            setLoadingText("Putting the finishing touches on your roster...");
            return;
        }

        if (isSubmitting) {
            // Cycle through loading messages every 5 seconds
            let messageIndex = 0;
            setLoadingText(LOADING_MESSAGES[0]);

            const intervalId = setInterval(() => {
                messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
                setLoadingText(LOADING_MESSAGES[messageIndex]);
            }, 5000);

            return () => {
                clearInterval(intervalId);
            };
        }

        // Not submitting or loading: reset loading text
        setLoadingText(null);

        return undefined;
    }, [isLoading, isSubmitting]);

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
            size="95%"
        >
            {!generatedLineup ? (
                showLoading ? (
                    <LoadingView
                        loadingText={loadingText}
                        onClose={handleClose}
                    />
                ) : (
                    <InitialView
                        aiError={aiError}
                        onClose={handleClose}
                        onGenerate={handleGenerateAILineup}
                    />
                )
            ) : (
                <ResultsView
                    generatedLineup={generatedLineup}
                    aiReasoning={aiReasoning}
                    onRegenerate={handleRegenerate}
                    onApply={handleApplyGeneratedLineup}
                />
            )}
        </DrawerContainer>
    );
}
