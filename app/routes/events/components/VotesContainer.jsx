import { useEffect, useState } from "react";
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

    return (
        <>
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
