import { useState, useEffect } from "react";
import { useOutletContext, useActionData } from "react-router";

import { Container, Group } from "@mantine/core";

import { trackEvent } from "@/utils/analytics";

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
    const actionData = useActionData();

    useEffect(() => {
        if (
            actionData?.success &&
            actionData?.event &&
            Object.keys(actionData.event).length > 0
        ) {
            trackEvent(actionData.event.name, actionData.event.data);
        }
    }, [actionData]);

    const currentUserId = user.$id;
    const managerView = managerIds.includes(currentUserId);

    // Parse the idealLineup
    let initialLineup = [];
    let initialReserves = [];

    if (team.idealLineup) {
        try {
            const parsed = JSON.parse(team.idealLineup);
            if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                initialLineup = Array.isArray(parsed.lineup)
                    ? parsed.lineup
                    : [];
                initialReserves = Array.isArray(parsed.reserves)
                    ? parsed.reserves
                    : [];
            }
        } catch (e) {
            console.error("Error parsing idealLineup", e);
        }
    }

    // Filter out deleted players
    initialLineup = initialLineup.filter((id) =>
        players.some((p) => p.$id === id),
    );
    initialReserves = initialReserves.filter((id) =>
        players.some((p) => p.$id === id),
    );

    // Find players missing from both lists
    const trackedIds = new Set([...initialLineup, ...initialReserves]);
    const missingPlayers = players
        .filter((p) => !trackedIds.has(p.$id))
        .map((p) => p.$id);

    // Add missing players
    if (initialLineup.length === 0 && initialReserves.length === 0) {
        // If everything is empty (new team), put everyone in lineup
        initialLineup = players.map((p) => p.$id);
    } else {
        // Otherwise append missing to reserves
        initialReserves = [...initialReserves, ...missingPlayers];
    }

    // Parse the idealPositioning
    let initialIdealPositioning = {};
    if (team.idealPositioning) {
        try {
            initialIdealPositioning = JSON.parse(team.idealPositioning);
        } catch (e) {
            console.error("Error parsing idealPositioning", e);
        }
    }

    const [lineup, setLineup] = useState(initialLineup);
    const [reserves, setReserves] = useState(initialReserves);

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
                lineup={lineup}
                reserves={reserves}
                setLineup={setLineup}
                setReserves={setReserves}
                idealPositioning={idealPositioning}
                setIdealPositioning={setIdealPositioning}
            />
        </Container>
    );
}
