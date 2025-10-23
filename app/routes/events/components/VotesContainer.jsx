import { useEffect, useState, useMemo } from "react";
import { useFetcher } from "react-router";

import { Button, Select, Text } from "@mantine/core";

import addPlayerAvailability from "../utils/addPlayerAvailability";

export default function VotesContainer({
    attendance,
    players,
    user,
    votes,
    team,
    game,
    activeAward,
}) {
    const [playerVotes, setPlayerVotes] = useState({});

    useEffect(() => {
        if (votes) {
            const userVotes = votes.documents.filter(
                (vote) => vote.voter_user_id === user.$id,
            );

            const initialVotes = userVotes.reduce((acc, vote) => {
                acc[vote.reason] = {
                    nominated_user_id: vote.nominated_user_id,
                    vote_id: vote.$id,
                };
                return acc;
            }, {});

            setPlayerVotes(initialVotes);
        }
    }, [votes, user.$id]);

    const fetcher = useFetcher();

    const handleVote = (award, playerId) => {
        setPlayerVotes((prevVotes) => ({
            ...prevVotes,
            [award]: {
                nominated_user_id: playerId,
                vote_id: prevVotes[award]?.vote_id,
            },
        }));
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
        } catch (error) {
            console.error("Error submitting votes:", error);
        }
    };

    const playersWithAvailability = addPlayerAvailability(
        attendance.documents,
        players,
    );

    // Build a map of vote counts per award per player:
    // { [award]: { [playerId]: count } }
    const countsByAward = useMemo(() => {
        const map = {};
        if (!votes?.documents) return map;

        votes.documents.forEach((vote) => {
            const reason = vote.reason;
            const playerId = vote.nominated_user_id;
            if (!reason || !playerId) return;

            if (!map[reason]) map[reason] = {};
            map[reason][playerId] = (map[reason][playerId] || 0) + 1;
        });

        return map;
    }, [votes]);

    // For the currently active award, sort players by vote count (desc).
    const sortedPlayersForActiveAward = useMemo(() => {
        const counts = countsByAward[activeAward] || {};
        return [...playersWithAvailability].sort((a, b) => {
            const ca = counts[a.$id] || 0;
            const cb = counts[b.$id] || 0;

            if (cb !== ca) return cb - ca; // higher votes first

            // tie-breaker: lastName then firstName
            const last = (a.lastName || "").localeCompare(b.lastName || "");
            if (last !== 0) return last;
            return (a.firstName || "").localeCompare(b.firstName || "");
        });
    }, [playersWithAvailability, countsByAward, activeAward]);

    return (
        <>
            <Text fw="bold">Vote for a Player:</Text>
            <Select
                placeholder="Select a player"
                nothingFoundMessage="No players"
                data={sortedPlayersForActiveAward.map((player) => {
                    const count = countsByAward[activeAward]?.[player.$id] || 0;
                    const name =
                        `${player.firstName || ""} ${player.lastName || ""}`.trim();
                    const votesText =
                        count > 0
                            ? ` (${count} vote${count === 1 ? "" : "s"})`
                            : "";
                    return { value: player.$id, label: `${name}${votesText}` };
                })}
                value={playerVotes[activeAward]?.nominated_user_id || null}
                onChange={(value) => handleVote(activeAward, value)}
                comboboxProps={{ withinPortal: false, position: "bottom" }}
                size="lg"
            />
            <Button
                variant="filled"
                radius="md"
                mt="md"
                type="submit"
                size="lg"
                loading={fetcher.state === "submitting"}
                onClick={handleSubmit}
                autoContrast
                fullWidth
            >
                Submit All Votes
            </Button>
        </>
    );
}
