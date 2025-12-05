import { useState } from "react";
import { useOutletContext } from "react-router";
import { Container, Group } from "@mantine/core";
import { useListState } from "@mantine/hooks";

import { getTeamById } from "@/loaders/teams";
import { saveTeamLineup } from "@/actions/lineups";

import BackButton from "@/components/BackButton";

import TeamLineupContainer from "./components/TeamLineupContainer";
import LineupValidationMenu from "@/components/Lineup/LineupValidationMenu";
import LineupMenu from "@/components/Lineup/LineupMenu";
import { validateLineup } from "@/components/Lineup/utils/validateLineup";

export async function loader({ params, request }) {
    const { teamId } = params;
    return getTeamById({ teamId, request });
}

export async function action({ request, params }) {
    const { teamId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === "save-chart") {
        return saveTeamLineup({ teamId, values });
    }
}

export default function TeamLineup({ loaderData }) {
    const { teamData: team, players, managerIds } = loaderData;
    const { user } = useOutletContext();
    const currentUserId = user.$id;
    const managerView = managerIds.includes(currentUserId);

    // Parse the idealLineup if it exists
    let initialLineup = null;
    if (team.idealLineup) {
        try {
            initialLineup = JSON.parse(team.idealLineup);
        } catch (e) {
            console.error("Error parsing idealLineup", e);
        }
    }

    const [lineupState, lineupHandlers] = useListState(initialLineup);
    const [hasBeenEdited, setHasBeenEdited] = useState(false);

    const playersNotInLineup = players?.filter((p) => {
        const isInLineup = lineupState?.some((lp) => lp.$id === p.$id);
        return !isInLineup;
    });

    const validationResults = validateLineup(lineupState, team);

    return (
        <Container p="md">
            <Group justify="space-between" align="center" mt="lg" mb="xl">
                <BackButton
                    text="Back to Team Details"
                    to={`/team/${team.$id}`}
                />
                {managerView && (
                    <Group gap="lg">
                        <LineupValidationMenu
                            validationResults={validationResults}
                        />
                        <LineupMenu
                            actionUrl={`/team/${team.$id}/lineup`}
                            playersNotInLineup={playersNotInLineup}
                            lineupState={lineupState}
                            lineupHandlers={lineupHandlers}
                            setHasBeenEdited={setHasBeenEdited}
                        />
                    </Group>
                )}
            </Group>

            <TeamLineupContainer
                team={team}
                managerView={managerView}
                playerChart={initialLineup}
                players={players}
                lineupState={lineupState}
                lineupHandlers={lineupHandlers}
                hasBeenEdited={hasBeenEdited}
                setHasBeenEdited={setHasBeenEdited}
                validationResults={validationResults}
            />
        </Container>
    );
}
