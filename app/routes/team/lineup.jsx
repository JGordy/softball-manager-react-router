import { useState } from "react";
import { useOutletContext } from "react-router";

import { Container, Group } from "@mantine/core";
import { useListState } from "@mantine/hooks";

import { getTeamById } from "@/loaders/teams";
import { saveBattingOrder, saveFieldingPositions } from "@/actions/lineups";

import BackButton from "@/components/BackButton";

import TeamLineupContainer from "./components/TeamLineupContainer";

export async function loader({ params, request }) {
    const { teamId } = params;
    return getTeamById({ teamId, request });
}

export async function action({ request, params }) {
    const { teamId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === "save-batting-order") {
        return saveBattingOrder({ teamId, values });
    }

    if (_action === "save-fielding-positions") {
        return saveFieldingPositions({ teamId, values });
    }
}

export default function TeamLineup({ loaderData }) {
    const { teamData: team, players, managerIds } = loaderData;

    const { user } = useOutletContext();

    const currentUserId = user.$id;
    const managerView = managerIds.includes(currentUserId);

    // Parse the idealLineup (array of IDs)
    let initialIdealLineup = [];
    if (team.idealLineup) {
        try {
            initialIdealLineup = JSON.parse(team.idealLineup);
        } catch (e) {
            console.error("Error parsing idealLineup", e);
        }
    }

    // Fallback if idealLineup is empty or failed parse: all players, alphabetically?
    // Or just empty and let them build it?
    // Let's seed it with all players if empty so they have something to drag.
    if (!initialIdealLineup || initialIdealLineup.length === 0) {
        initialIdealLineup = players.map((p) => p.$id);
    }
    // Ensure all current players are in the list if not already (in case of new players added after lineup set)
    // Actually, better to just append missing ones at the end?
    const missingPlayers = players
        .filter((p) => !initialIdealLineup.includes(p.$id))
        .map((p) => p.$id);
    if (missingPlayers.length > 0) {
        initialIdealLineup = [...initialIdealLineup, ...missingPlayers];
    }
    // Filter out IDs that no longer exist in players array (deleted players)
    initialIdealLineup = initialIdealLineup.filter((id) =>
        players.some((p) => p.$id === id),
    );

    // Parse the idealPositioning
    let initialIdealPositioning = {};
    if (team.idealPositioning) {
        try {
            initialIdealPositioning = JSON.parse(team.idealPositioning);
        } catch (e) {
            console.error("Error parsing idealPositioning", e);
        }
    }

    const [idealLineup, lineupHandlers] = useListState(initialIdealLineup);
    const [idealPositioning, setIdealPositioning] = useState(
        initialIdealPositioning,
    );

    return (
        <Container p="md">
            <Group justify="space-between" align="center" mt="lg" mb="xl">
                <BackButton
                    text="Back to Team Details"
                    to={`/team/${team.$id}`}
                />
            </Group>

            <TeamLineupContainer
                team={team}
                managerView={managerView}
                players={players}
                idealLineup={idealLineup}
                lineupHandlers={lineupHandlers}
                idealPositioning={idealPositioning}
                setIdealPositioning={setIdealPositioning}
            />
        </Container>
    );
}
