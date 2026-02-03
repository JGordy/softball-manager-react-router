import { useState, useEffect } from "react";

import { trackEvent } from "@/utils/analytics";
import { validateLineup, sanitizeReasoning } from "@/utils/lineupValidation";
import { tryParsePartialLineup } from "@/utils/json";

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
    const [isStreaming, setIsStreaming] = useState(false);
    const showLoading = isStreaming;

    const [aiError, setAiError] = useState(null);
    const [generatedLineup, setGeneratedLineup] = useState(null);
    const [partialLineup, setPartialLineup] = useState([]);
    const [loadingText, setLoadingText] = useState(null);
    const [aiReasoning, setAiReasoning] = useState(null);

    // Filter for available players (accepted or tentative) to determine expected lineup size
    const availablePlayers =
        players?.filter(
            (p) =>
                p.availability === "accepted" || p.availability === "tentative",
        ) || [];

    // Manage loading text
    useEffect(() => {
        if (isStreaming) {
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

        // Not streaming: reset loading text
        setLoadingText(null);
        return undefined;
    }, [isStreaming]);

    const handleGenerateAILineup = async () => {
        setAiError(null);
        setPartialLineup([]);

        if (
            !availablePlayers ||
            availablePlayers.length < MIN_PLAYERS_FOR_AI_LINEUP
        ) {
            setAiError(
                `Need at least ${MIN_PLAYERS_FOR_AI_LINEUP} available players to generate a lineup`,
            );
            return;
        }

        setIsStreaming(true);
        trackEvent("ai-lineup-requested", {
            teamId: team.$id,
            gameId: game?.$id,
        });

        try {
            const response = await fetch("/api/lineup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
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
            });

            if (!response.ok) {
                // Read error body as text first so we don't lose details if JSON parsing fails
                const errorText = await response.text();
                let errorMessage = "Failed to request lineup generation";

                if (errorText) {
                    try {
                        const errorData = JSON.parse(errorText);
                        errorMessage =
                            errorData?.error ||
                            errorData?.message ||
                            errorText ||
                            errorMessage;
                    } catch (_parseError) {
                        // Not valid JSON; use raw text
                        errorMessage = errorText;
                    }
                } else {
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }

                throw new Error(errorMessage);
            }

            // Stream reading logic
            if (!response.body) {
                throw new Error("Response body is empty");
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let resultText = "";
            let aiResponse;

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    resultText += chunk;

                    // Attempt to parse partially to show progress
                    const partial = tryParsePartialLineup(resultText);
                    if (partial && partial.length > 0) {
                        setPartialLineup(partial);
                    }
                }

                // Parse and Validate locally
                try {
                    aiResponse = JSON.parse(resultText);
                } catch (e) {
                    const maxLogLength = 200;
                    const truncatedResultText =
                        typeof resultText === "string" &&
                        resultText.length > maxLogLength
                            ? resultText.slice(0, maxLogLength) +
                              `... [truncated ${resultText.length - maxLogLength} characters]`
                            : resultText;

                    console.error(
                        "Failed to parse AI response JSON",
                        truncatedResultText,
                        e,
                    );
                    throw new Error("Received invalid JSON from AI stream.");
                }
            } catch (error) {
                try {
                    // Cancel the reader to abort the stream on error
                    await reader.cancel(
                        error instanceof Error ? error : undefined,
                    );
                } catch (_cancelError) {
                    // Ignore cancellation errors to avoid masking the original error
                }
                throw error;
            } finally {
                // Ensure the reader lock is released; let any errors surface
                reader.releaseLock();
            }

            if (aiResponse?.error) {
                throw new Error(aiResponse.error);
            }

            if (!aiResponse || !aiResponse.lineup) {
                throw new Error("AI response missing lineup data.");
            }

            const validLineup = validateLineup(
                aiResponse.lineup,
                availablePlayers,
            );
            const validReasoning = sanitizeReasoning(
                aiResponse.reasoning || "No reasoning provided",
            );

            setGeneratedLineup(validLineup);
            setAiReasoning(validReasoning);
            trackEvent("ai-lineup-generated", {
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
        } finally {
            setIsStreaming(false);
        }
    };

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
        onClose();
        setAiError(null);
        setGeneratedLineup(null);
        setAiReasoning(null);
    };

    const handleRegenerate = () => {
        setGeneratedLineup(null);
        setPartialLineup([]);
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
                        partialLineup={partialLineup}
                        totalPlayers={availablePlayers.length || 10}
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
