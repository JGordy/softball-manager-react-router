import { useMemo, useEffect } from "react";

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

// NOTE: fires confetti when user is winner for the active award
function useWinnerConfetti({ entries, activeAward, team, user }) {
    useEffect(() => {
        try {
            if (typeof window === "undefined") return;
            if (!entries || entries.length === 0) return;

            const max = Math.max(...entries.map(([, c]) => c));
            const winnerIds = entries
                .filter(([, c]) => c === max)
                .map(([id]) => id);

            const userId = user && user.$id;
            const userIsWinner = userId && winnerIds.includes(userId);

            if (userIsWinner) {
                import("canvas-confetti")
                    .then((mod) => {
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

                        const myConfetti = confetti.create(canvas, {
                            resize: true,
                            useWorker: true,
                        });

                        // Build colors array: team primary first (if present), then a few muted supporting colors
                        const primary =
                            team && team.primaryColor
                                ? team.primaryColor
                                : null;
                        const supporting = ["#FFD166", "#A0AEC0", "#E2E8F0"]; // warm yellow and muted grays
                        const colors = primary
                            ? [primary, ...supporting]
                            : supporting;

                        myConfetti({
                            particleCount: 100,
                            spread: 60,
                            origin: { y: 0.6 },
                            colors,
                        });
                        myConfetti({
                            particleCount: 50,
                            spread: 110,
                            origin: { y: 0.8 },
                            colors,
                        });

                        setTimeout(() => {
                            try {
                                if (canvas && canvas.parentNode)
                                    canvas.parentNode.removeChild(canvas);
                            } catch (e) {
                                /* ignore */
                            }
                        }, 5000);
                    })
                    .catch((err) => {
                        // eslint-disable-next-line no-console
                        console.error("Failed to load confetti", err);
                    });
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Confetti effect error", e);
        }
    }, [entries, activeAward, user]);
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

    useWinnerConfetti({ entries, activeAward, team, user });

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
