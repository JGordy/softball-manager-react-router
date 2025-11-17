import { Button, Text } from "@mantine/core";

import { IconPlus } from "@tabler/icons-react";

import AddSingleGame from "@/forms/AddSingleGame";

import GamesList from "@/components/GamesList";

import sortByDate from "@/utils/sortByDate";
import { DateTime } from "luxon";

import useModal from "@/hooks/useModal";

export default function GamesListContainer({
    games,
    seasons,
    teamId,
    primaryColor,
    managerView,
}) {
    const { openModal } = useModal();

    const today = DateTime.local();
    let seasonToDisplay = seasons.find((season) => {
        const start = DateTime.fromISO(season.startDate);
        const end = DateTime.fromISO(season.endDate);
        return start <= today && end >= today;
    });

    if (!seasonToDisplay) {
        const upcomingSeasons = seasons.filter(
            (season) => DateTime.fromISO(season.startDate) > today,
        );
        if (upcomingSeasons.length > 0) {
            seasonToDisplay = upcomingSeasons[0];
        } else {
            const pastSeasons = seasons
                .filter(
                    (season) =>
                        DateTime.fromISO(season.endDate).toMillis() <
                        today.toMillis(),
                )
                .sort(
                    (a, b) =>
                        DateTime.fromISO(b.endDate).toMillis() -
                        DateTime.fromISO(a.endDate).toMillis(),
                );
            if (pastSeasons.length > 0) {
                seasonToDisplay = pastSeasons[0];
            }
        }
    }

    const gamesToDisplay = seasonToDisplay ? seasonToDisplay.games : [];
    const sortedGames = sortByDate(gamesToDisplay, "gameDate");

    const openAddGameModal = () =>
        openModal({
            title: "Add a New Game",
            children: (
                <AddSingleGame
                    action="add-single-game"
                    actionRoute={`/team/${teamId}`}
                    buttonColor={primaryColor}
                    teamId={teamId}
                    seasonId={seasonToDisplay ? seasonToDisplay.$id : null}
                    seasons={seasons}
                    confirmText="Create Game"
                />
            ),
        });

    return (
        <>
            {managerView && (
                <Button
                    my="md"
                    color={primaryColor}
                    onClick={openAddGameModal}
                    autoContrast
                    fullWidth
                >
                    <IconPlus size={20} />
                    Add New Game
                </Button>
            )}

            <GamesList games={sortedGames} />
        </>
    );
}
