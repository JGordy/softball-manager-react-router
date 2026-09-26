import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router";

import {
    Avatar,
    Badge,
    Button,
    Card,
    Group,
    Select,
    Stack,
    Text,
} from "@mantine/core";
import { IconCheck, IconEdit } from "@tabler/icons-react";
import { trackEvent } from "@/utils/analytics";
import { showNotification } from "@/utils/showNotification";

import addPlayerAvailability from "@/utils/addPlayerAvailability";

/**
 * Component for voting for teammates across various awards categories.
 * Supports submitting nominations, viewing submitted votes per award category,
 * and changing votes.
 *
 * @param {Object} props - Component props
 * @param {Object} props.attendance - Attendance records for the game
 * @param {Array<Object>} props.players - Team player roster
 * @param {Object} props.user - Currently logged in user
 * @param {Object} props.votes - Collection of recorded votes for the game
 * @param {Object} props.team - Team details
 * @param {Object} props.game - Game details
 * @param {string} props.activeAward - The currently selected award category in the carousel
 * @returns {JSX.Element} The rendered votes container
 */
export default function VotesContainer({
    attendance,
    players = [],
    user,
    votes,
    team,
    game,
    activeAward,
}) {
    // Calculate saved votes from existing records in DB for current user
    const savedVotes = useMemo(() => {
        if (!votes?.rows || !user?.$id) return {};
        const userVotes = votes.rows.filter(
            (vote) =>
                vote.voter_user_id === user.$id &&
                Boolean(vote.nominated_user_id),
        );

        return userVotes.reduce((acc, vote) => {
            acc[vote.reason] = {
                nominated_user_id: vote.nominated_user_id,
                vote_id: vote.$id,
            };
            return acc;
        }, {});
    }, [votes, user]);

    const hasSubmittedVotes = useMemo(
        () => Object.keys(savedVotes).length > 0,
        [savedVotes],
    );

    const [playerVotes, setPlayerVotes] = useState(savedVotes);
    const [isEditing, setIsEditing] = useState(() => !hasSubmittedVotes);

    const initialCheckDone = useRef(false);
    useEffect(() => {
        if (!initialCheckDone.current && hasSubmittedVotes) {
            setIsEditing(false);
            initialCheckDone.current = true;
        }
    }, [hasSubmittedVotes]);

    useEffect(() => {
        setPlayerVotes(savedVotes);
    }, [savedVotes]);

    const fetcher = useFetcher();
    const prevFetcherState = useRef(fetcher.state);

    useEffect(() => {
        if (
            prevFetcherState.current !== "idle" &&
            fetcher.state === "idle" &&
            fetcher.data
        ) {
            if (fetcher.data.success) {
                showNotification({
                    title: "Votes Submitted",
                    message: "Your votes have been successfully recorded.",
                    variant: "success",
                });
                setIsEditing(false);
            } else if (fetcher.data.error || fetcher.data.success === false) {
                showNotification({
                    title: "Submission Failed",
                    message: fetcher.data.error || "Failed to submit votes.",
                    variant: "error",
                });
            }
        }
        prevFetcherState.current = fetcher.state;
    }, [fetcher.state, fetcher.data]);

    const handleVote = (award, playerId) => {
        setPlayerVotes((prevVotes) => ({
            ...prevVotes,
            [award]: {
                nominated_user_id: playerId,
                vote_id: prevVotes[award]?.vote_id,
            },
        }));
    };

    const handleCancel = () => {
        setPlayerVotes(savedVotes);
        setIsEditing(false);
    };

    const handleSubmit = () => {
        try {
            const formData = new FormData();
            formData.append("playerVotes", JSON.stringify(playerVotes));
            formData.append("_action", "send-votes");
            formData.append("team_id", team.$id);
            formData.append("voter_user_id", user.$id);

            fetcher.submit(formData, {
                action: `/events/${game.$id}`,
                method: "post",
            });

            trackEvent("submit-game-votes", { eventId: game.$id });
        } catch (error) {
            console.error("Error submitting votes:", error);
        }
    };

    const playersWithAvailability = addPlayerAvailability(
        attendance?.rows || [],
        players,
    );

    // If the user has already submitted votes and is not currently in edit mode, show submitted state
    if (!isEditing && hasSubmittedVotes) {
        const nominatedUserId = playerVotes[activeAward]?.nominated_user_id;
        const nominatedPlayer = players.find((p) => p.$id === nominatedUserId);

        return (
            <Stack gap="xs">
                <Group justify="space-between" align="center">
                    <Text fw="bold">Your Vote:</Text>
                    <Badge
                        color="lime"
                        variant="light"
                        size="sm"
                        leftSection={<IconCheck size={12} stroke={3} />}
                    >
                        Vote Submitted
                    </Badge>
                </Group>

                {nominatedPlayer ? (
                    <Card
                        radius="md"
                        p="md"
                        withBorder
                        bg="var(--bg-card)"
                        style={{
                            borderColor: "var(--mantine-color-default-border)",
                        }}
                    >
                        <Group justify="space-between" align="center">
                            <Group gap="sm">
                                <Avatar color="lime" radius="xl" size="md">
                                    {(
                                        (nominatedPlayer.firstName?.[0] || "") +
                                        (nominatedPlayer.lastName?.[0] || "")
                                    ).toUpperCase() || <IconCheck size={18} />}
                                </Avatar>
                                <div>
                                    <Text fw={600} size="md">
                                        {`${nominatedPlayer.firstName || ""} ${nominatedPlayer.lastName || ""}`.trim() ||
                                            "Player"}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        {nominatedPlayer
                                            .preferredPositions?.[0] ||
                                            "Player"}
                                    </Text>
                                </div>
                            </Group>
                            <Badge color="lime" variant="dot" size="md">
                                Your Pick
                            </Badge>
                        </Group>
                    </Card>
                ) : (
                    <Card
                        radius="md"
                        p="md"
                        withBorder
                        bg="var(--bg-card)"
                        style={{
                            borderColor: "var(--mantine-color-default-border)",
                        }}
                    >
                        <Text c="dimmed" size="sm" ta="center">
                            No vote cast for this award.
                        </Text>
                    </Card>
                )}

                <Button
                    variant="light"
                    color="lime"
                    radius="md"
                    mt="xs"
                    size="md"
                    leftSection={<IconEdit size={18} />}
                    onClick={() => setIsEditing(true)}
                    fullWidth
                >
                    Change Votes
                </Button>
            </Stack>
        );
    }

    return (
        <Stack gap="xs">
            <Text fw="bold">Vote for a Player:</Text>
            <Select
                placeholder="Select a player"
                nothingFoundMessage="No players"
                data={playersWithAvailability.map((player) => ({
                    value: player.$id,
                    label: `${player.firstName || ""} ${player.lastName || ""}`.trim(),
                }))}
                value={playerVotes[activeAward]?.nominated_user_id || null}
                onChange={(value) => handleVote(activeAward, value)}
                comboboxProps={{ withinPortal: false, position: "bottom" }}
                size="lg"
            />
            {hasSubmittedVotes ? (
                <Group mt="xs" grow>
                    <Button
                        variant="default"
                        radius="md"
                        size="lg"
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="filled"
                        radius="md"
                        type="submit"
                        size="lg"
                        loading={fetcher.state === "submitting"}
                        onClick={handleSubmit}
                        autoContrast
                    >
                        Update Votes
                    </Button>
                </Group>
            ) : (
                <Button
                    variant="filled"
                    radius="md"
                    mt="xs"
                    type="submit"
                    size="lg"
                    loading={fetcher.state === "submitting"}
                    onClick={handleSubmit}
                    autoContrast
                    fullWidth
                >
                    Submit All Votes
                </Button>
            )}
        </Stack>
    );
}
