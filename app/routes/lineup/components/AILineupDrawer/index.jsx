import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router";
import * as Sentry from "@sentry/react-router";

import { trackEvent } from "@/utils/analytics";
import { validateLineup, sanitizeReasoning } from "@/utils/lineupValidation";
import { tryParsePartialLineup } from "@/utils/json";
import { MAX_AI_GENERATIONS_PER_GAME } from "@/constants/ai";

import DrawerContainer from "@/components/DrawerContainer";

import InitialView from "./InitialView";
import LoadingView from "./LoadingView";
import ResultsView from "./ResultsView";

// Need at least 9 players to generate a meaningful batting order and fielding chart
const MIN_PLAYERS_FOR_AI_LINEUP = 9;

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
    const { isDesktop } = useOutletContext();
    const [isStreaming, setIsStreaming] = useState(false);
    const showLoading = isStreaming;

    const [aiError, setAiError] = useState(null);
    const [generatedLineup, setGeneratedLineup] = useState(null);
    const [partialLineup, setPartialLineup] = useState([]);
    const [loadingText, setLoadingText] = useState(null);
    const [aiReasoning, setAiReasoning] = useState(null);

    // Track local successful generations to update UI immediately without revalidation
    const [generationIncrements, setGenerationIncrements] = useState(0);
    const generationsUsed =
        (game?.aiGenerationCount || 0) + generationIncrements;

    const abortControllerRef = useRef(null);

    useEffect(() => {
        // Abort any in-flight request when the drawer unmounts
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

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

        // Abort any previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        // Track that we attempted a generation to sync with server count on abort
        let generationAttempted = false;

        setIsStreaming(true);
        trackEvent("ai-lineup-requested", {
            teamId: team.$id,
            gameId: game?.$id,
        });

        try {
            generationAttempted = true;
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
                signal: controller.signal,
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

                    // If stream was cut off (e.g. while outputting reasoning), try to salvage lineup from partial parse
                    const recoveredLineup = tryParsePartialLineup(resultText);
                    if (recoveredLineup && recoveredLineup.length > 0) {
                        console.warn(
                            "Salvaged complete lineup from interrupted AI stream",
                        );
                        aiResponse = {
                            lineup: recoveredLineup,
                            reasoning:
                                "Lineup generated from AI stream (reasoning was truncated).",
                        };
                    } else {
                        throw new Error(
                            "Received invalid JSON from AI stream.",
                        );
                    }
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
                { autoRepair: true },
            );
            const validReasoning = sanitizeReasoning(
                aiResponse.reasoning || "No reasoning provided",
            );

            setGeneratedLineup(validLineup);
            setAiReasoning(validReasoning);
            setGenerationIncrements((prev) => prev + 1);
            trackEvent("ai-lineup-generated", {
                teamId: team.$id,
                gameId: game?.$id,
            });
        } catch (error) {
            if (error.name === "AbortError") {
                // User cancelled, do not set error state
                // If we started a generation, the server likely counted it, so we should update our local count
                if (generationAttempted) {
                    setGenerationIncrements((prev) => prev + 1);
                }
                return;
            }

            const message =
                error instanceof Error ? error.message : String(error || "");

            if (process.env.NODE_ENV === "development") {
                console.error("Error generating AI lineup:", error);
            } else {
                console.error("Error generating AI lineup:", message);
            }

            try {
                Sentry.captureException(error, {
                    tags: {
                        feature: "ai-lineup",
                        phase: "client_generation",
                    },
                    extra: {
                        teamId: team?.$id,
                        gameId: game?.$id,
                        availablePlayerCount: availablePlayers?.length,
                        partialLineupCount: partialLineup?.length,
                        errorMessage: message,
                    },
                });
            } catch (sentryErr) {
                console.error(
                    "Failed to send client exception to Sentry:",
                    sentryErr,
                );
            }

            const userMessage = getFriendlyClientErrorMessage(error);

            setAiError(userMessage);
        } finally {
            abortControllerRef.current = null;
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
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        onClose();
        setAiError(null);
        setGeneratedLineup(null);
        setAiReasoning(null);
    };

    const handleRegenerate = async () => {
        setGeneratedLineup(null);
        setPartialLineup([]);
        setAiReasoning(null);
        setAiError(null);
        await handleGenerateAILineup();
    };

    return (
        <DrawerContainer
            title="Generate AI Lineup"
            opened={opened}
            onClose={handleClose}
            size={isDesktop ? "md" : "95%"}
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
                        generationsUsed={generationsUsed}
                        maxGenerations={MAX_AI_GENERATIONS_PER_GAME}
                        notEnoughPlayers={
                            availablePlayers.length < MIN_PLAYERS_FOR_AI_LINEUP
                        }
                    />
                )
            ) : (
                <ResultsView
                    generatedLineup={generatedLineup}
                    aiReasoning={aiReasoning}
                    onRegenerate={handleRegenerate}
                    onApply={handleApplyGeneratedLineup}
                    generationsUsed={generationsUsed}
                    maxGenerations={MAX_AI_GENERATIONS_PER_GAME}
                />
            )}
        </DrawerContainer>
    );
}

/**
 * Convert technical error strings into clean, user-friendly UI messages
 * ensuring internal database IDs, stack traces, and technical jargon are not exposed.
 *
 * @param {Error|any} error - The caught error
 * @returns {string} Human-friendly message safe for the UI
 */
export function getFriendlyClientErrorMessage(error) {
    if (!error) return "Unable to generate lineup. Please try again.";

    const rawMessage =
        error instanceof Error ? error.message : String(error || "");

    // In development or test, allow the raw message so developers and automated tests can inspect it
    if (
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test"
    ) {
        return rawMessage || "Unable to generate lineup. Please try again.";
    }

    const lower = rawMessage.toLowerCase();

    // Roster player count requirement
    if (lower.includes("need at least") || lower.includes("minimum of 9")) {
        return "A minimum of 9 available players is required to generate an AI lineup.";
    }

    // Game generation limit (max generations per game)
    if (lower.includes("generation limit")) {
        return "AI generation limit reached for this game (max 3).";
    }

    // Rate limits / quotas
    if (
        lower.includes("rate limit") ||
        lower.includes("rate-limited") ||
        lower.includes("quota") ||
        lower.includes("429")
    ) {
        return "The AI service is busy or rate-limited. Please wait a minute and try again.";
    }

    // Service outages / overloading
    if (
        lower.includes("overloaded") ||
        lower.includes("unavailable") ||
        lower.includes("503")
    ) {
        return "The AI service is temporarily overloaded. Please try again in a few moments.";
    }

    // Interrupted stream or JSON parse failure
    if (
        lower.includes("invalid json") ||
        lower.includes("interrupted") ||
        lower.includes("stream")
    ) {
        return "Lineup generation was interrupted before completion. Please try again.";
    }

    // Lineup validation / roster mismatch (prevents leaking internal player IDs)
    if (
        lower.includes("positions") ||
        lower.includes("duplicate") ||
        lower.includes("missing player") ||
        lower.includes("validation") ||
        lower.includes("lineup")
    ) {
        return "The AI was unable to create a valid lineup for the current roster. Please try again.";
    }

    // Network / fetch errors
    if (
        lower.includes("network") ||
        lower.includes("failed to fetch") ||
        lower.includes("failed to request")
    ) {
        return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    return "Unable to generate lineup right now. Please try again.";
}
