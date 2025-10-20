import { useMemo, useEffect, useRef } from "react";

import {
    Avatar,
    Badge,
    Card,
    Center,
    Group,
    Text,
    Title,
    Stack,
} from "@mantine/core";

// Hook returns a startConfetti function. Caller should call it when the active award
// changes and the caller determines it's the right time to run confetti.
function useWinnerConfetti(team) {
    const stateRef = useRef({
        cancelled: false,
        canvas: null,
        myConfetti: null,
        removeTimer: null,
    });

    // cleanup on unmount
    useEffect(() => {
        return () => {
            const state = stateRef.current;
            state.cancelled = true;
            try {
                if (state.removeTimer) clearTimeout(state.removeTimer);
            } catch (e) {
                /* ignore */
            }

            try {
                if (
                    state.myConfetti &&
                    typeof state.myConfetti.reset === "function"
                ) {
                    try {
                        state.myConfetti.reset();
                    } catch (e) {
                        /* ignore */
                    }
                }
            } catch (e) {
                /* ignore */
            }

            try {
                if (state.canvas && state.canvas.parentNode) {
                    state.canvas.parentNode.removeChild(state.canvas);
                }
                state.canvas = null;
                state.myConfetti = null;
            } catch (e) {
                /* ignore */
            }
        };
        // run only on mount/unmount — don't run on `team` changes, that can
        // erroneously mark the instance as cancelled and block later calls.
    }, []);

    const startConfetti = async ({ entries, user }) => {
        if (typeof window === "undefined") return;
        if (!entries || entries.length === 0) return;

        const state = stateRef.current;

        try {
            const max = Math.max(...entries.map(([, c]) => c));
            const winnerIds = entries
                .filter(([, c]) => c === max)
                .map(([id]) => id);
            const userId = user && user.$id;
            const userIsWinner = userId && winnerIds.includes(userId);
            if (!userIsWinner) return;

            const mod = await import("canvas-confetti");

            const confetti = mod.default || mod;

            const canvas = document.createElement("canvas");
            canvas.style.position = "fixed";
            canvas.style.top = "0";
            canvas.style.left = "0";
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.style.pointerEvents = "none";
            canvas.style.zIndex = "2147483646";
            document.body.appendChild(canvas);

            // prefer main-thread confetti so reset() works synchronously
            const myConfetti = confetti.create(canvas, {
                resize: true,
                useWorker: false,
            });

            state.canvas = canvas;
            state.myConfetti = myConfetti;

            const primary =
                team && team.primaryColor ? team.primaryColor : null;
            const supporting = ["#FFD166", "#A0AEC0", "#E2E8F0"];
            const colors = primary ? [primary, ...supporting] : supporting;

            myConfetti({
                angle: 105,
                particleCount: 80,
                spread: 25,
                origin: { y: 1, x: 1 },
                startVelocity: 70,
                colors,
            });
            myConfetti({
                angle: 75,
                particleCount: 80,
                spread: 25,
                origin: { y: 1, x: 0 },
                startVelocity: 70,
                colors,
            });

            // schedule removal of the canvas after the burst completes
            state.removeTimer = setTimeout(() => {
                try {
                    if (state.canvas && state.canvas.parentNode) {
                        state.canvas.parentNode.removeChild(state.canvas);
                    }
                    state.canvas = null;
                    state.myConfetti = null;
                } catch (e) {
                    /* ignore */
                }
            }, 5000);
            // confetti fired
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Failed to run confetti", err);
        }
    };

    return startConfetti;
}

export default function WinnerDisplay({
    players = [],
    team,
    user,
    votes,
    activeAward,
}) {
    const counts = useMemo(() => {
        const map = {};
        if (!votes?.documents) return map;

        votes.documents.forEach((vote) => {
            if (vote.reason !== activeAward) return;
            const playerId = vote.nominated_user_id;
            if (!playerId) return;
            map[playerId] = (map[playerId] || 0) + 1;
        });

        return map;
    }, [votes, activeAward]);

    const entries = Object.entries(counts);

    // compute winners synchronously from entries for the current render
    const maxVotes =
        entries.length > 0 ? Math.max(...entries.map(([, c]) => c)) : 0;
    const currentWinnerIds = entries
        .filter(([, c]) => c === maxVotes)
        .map(([id]) => id);

    const startConfetti = useWinnerConfetti(team);
    const confettiDebounceRef = useRef(null);

    // Caller controls when confetti fires. Trigger when activeAward changes.
    useEffect(() => {
        // clear existing debounce if any
        if (confettiDebounceRef.current) {
            clearTimeout(confettiDebounceRef.current);
            confettiDebounceRef.current = null;
        }

        confettiDebounceRef.current = setTimeout(() => {
            const userIdRaw = user?.$id;
            const userId = userIdRaw != null ? String(userIdRaw) : null;
            const winnerIdStrings = currentWinnerIds.map((id) => String(id));

            if (userId && winnerIdStrings.includes(userId)) {
                startConfetti({ entries, user });
            }
        }, 500);

        return () => {
            if (confettiDebounceRef.current) {
                clearTimeout(confettiDebounceRef.current);
                confettiDebounceRef.current = null;
            }
        };

        // deliberately only watch activeAward so we fire per-award changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeAward]);

    if (entries.length === 0) {
        return (
            <Card radius="lg" p="md">
                <Center>
                    <Stack spacing="xs" align="center">
                        <Text ta="center" size="sm">
                            No votes recorded for this award yet.
                        </Text>
                        <Text size="xs" c="dimmed">
                            Once votes are in, winners will appear here.
                        </Text>
                    </Stack>
                </Center>
            </Card>
        );
    }

    const max = Math.max(...entries.map(([, c]) => c));
    const winnerIds = entries.filter(([, c]) => c === max).map(([id]) => id);

    const winnerPlayers = winnerIds
        .map((id) => players.find((p) => p.$id === id))
        .filter(Boolean);

    const isTie = winnerPlayers.length > 1;

    return (
        <>
            <Card mt="lg" radius="lg" px="md" py="xl" className="winner-card">
                <Stack spacing="xs">
                    <Title order={3} size="h1" ta="center" py="0">
                        {isTie ? "Tie!" : "Winner!"}
                    </Title>
                    <Text size="sm" c="dimmed" ta="center">
                        {isTie
                            ? `Each with ${max} vote${max === 1 ? "" : "s"}`
                            : `With ${max} total vote${max === 1 ? "" : "s"}`}
                    </Text>
                    {winnerPlayers.map((player) => {
                        return (
                            <Group
                                key={player.$id}
                                justify="space-between"
                                spacing="sm"
                            >
                                <Group spacing="sm">
                                    <Avatar
                                        color="yellow"
                                        radius="xl"
                                        size="md"
                                    >
                                        🏆
                                    </Avatar>
                                    <div>
                                        <Text size="xl" fw={700}>
                                            {player.firstName} {player.lastName}
                                        </Text>
                                        <Text size="sm" c="dimmed">
                                            {player.preferredPositions.length >
                                            0
                                                ? player.preferredPositions[0]
                                                : "Player"}
                                        </Text>
                                    </div>
                                </Group>

                                <Badge
                                    radius="sm"
                                    size="lg"
                                    variant="gradient"
                                    gradient={{ from: "orange", to: "yellow" }}
                                >
                                    {max} vote{max === 1 ? "" : "s"}
                                </Badge>
                            </Group>
                        );
                    })}
                </Stack>
            </Card>

            {/* Other players who received votes */}
            {/** Build a list of non-winning entries sorted by votes desc */}
            {(() => {
                const otherEntries = entries
                    .filter(([id]) => !winnerIds.includes(id))
                    .map(([id, count]) => ({ id, count }))
                    .sort((a, b) => b.count - a.count);

                if (otherEntries.length === 0) return null;

                return (
                    <Card
                        mt="md"
                        radius="lg"
                        p="md"
                        className="other-receiving-card"
                    >
                        <Title order={5} size="h5" mb="sm">
                            Other Receiving Votes
                        </Title>

                        <Stack spacing="xs">
                            {otherEntries.map(({ id, count }) => {
                                const player = players.find(
                                    (p) => p.$id === id,
                                );
                                if (!player) return null;

                                return (
                                    <Group key={id} position="apart">
                                        <Group spacing="sm">
                                            <Avatar color="gray" radius="xl">
                                                {(
                                                    (
                                                        player.firstName || ""
                                                    ).charAt(0) +
                                                    (
                                                        player.lastName || ""
                                                    ).charAt(0)
                                                ).toUpperCase()}
                                            </Avatar>
                                            <div>
                                                <Text fw={600}>
                                                    {player.firstName}{" "}
                                                    {player.lastName}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {player.preferredPositions &&
                                                    player.preferredPositions
                                                        .length > 0
                                                        ? player
                                                              .preferredPositions[0]
                                                        : "Player"}
                                                </Text>
                                            </div>
                                        </Group>

                                        <Badge radius="sm" color="gray">
                                            {count} vote{count === 1 ? "" : "s"}
                                        </Badge>
                                    </Group>
                                );
                            })}
                        </Stack>
                    </Card>
                );
            })()}
        </>
    );
}
