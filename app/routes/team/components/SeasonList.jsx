import { Link } from "react-router";

import { Button, Card, Group, ScrollArea, Text } from "@mantine/core";

import { IconChevronRight, IconPlus } from "@tabler/icons-react";

import AddSeason from "@/forms/AddSeason";
import { DateTime } from "luxon";
import { formatForViewerDate } from "@/utils/dateTime";

import useModal from "@/hooks/useModal";

export default function SeasonList({
    seasons,
    teamId,
    managerView,
    primaryColor,
}) {
    const { openModal } = useModal();

    const getSeasonStatus = (season) => {
        const today = DateTime.local();
        const oneMonthFromNow = today.plus({ months: 1 });

        const startDate = DateTime.fromISO(season.startDate);
        const endDate = DateTime.fromISO(season.endDate);

        if (startDate <= today && today <= endDate) {
            const { games } = season;
            if (games && games.length > 0) {
                // Find the upcoming game object, not just the date
                const upcomingGame = games
                    .filter((game) => DateTime.fromISO(game.gameDate) > today)
                    .sort(
                        (a, b) =>
                            DateTime.fromISO(a.gameDate).toMillis() -
                            DateTime.fromISO(b.gameDate).toMillis(),
                    )[0];

                if (upcomingGame) {
                    const timeDiff = DateTime.fromISO(
                        upcomingGame.gameDate,
                    ).diff(today, "days").days;
                    const daysUntilGame = Math.ceil(timeDiff);

                    const daysUntilText = `${daysUntilGame} day${daysUntilGame !== 1 ? "s" : ""}`;

                    return (
                        <Text span fw={700} c="green">
                            Next game {upcomingGame.isHomeGame ? "vs" : "@"}{" "}
                            {upcomingGame.opponent} in {daysUntilText}!
                        </Text>
                    );
                }
            }
            return "Season in progress";
        }
    };

    const openAddSeasonModal = () =>
        openModal({
            title: "Add a New Season",
            children: (
                <AddSeason
                    actionRoute={`/team/${teamId}`}
                    buttonColor={primaryColor}
                    teamId={teamId}
                />
            ),
        });

    const addSeasonCta = (
        <Button
            mt="md"
            variant="filled"
            color={primaryColor}
            onClick={openAddSeasonModal}
            autoContrast
            fullWidth
        >
            <IconPlus size={20} />
            Add New Season
        </Button>
    );

    const today = DateTime.local();
    const inProgressSeasons = seasons.filter(
        (season) =>
            DateTime.fromISO(season.startDate) <= today &&
            DateTime.fromISO(season.endDate) >= today,
    );
    const upcomingSeasons = seasons.filter(
        (season) => DateTime.fromISO(season.startDate) > today,
    );
    const pastSeasons = seasons
        .filter(
            (season) =>
                DateTime.fromISO(season.endDate).toMillis() < today.toMillis(),
        )
        .sort(
            (a, b) =>
                DateTime.fromISO(b.endDate).toMillis() -
                DateTime.fromISO(a.endDate).toMillis(),
        );

    const renderSeason = (season) => (
        <Link to={`/season/${season.$id}`} key={season.$id}>
            <Card
                key={season.$id}
                mt="sm"
                radius="md"
                p="sm"
                py="md"
                withBorder
            >
                <Group justify="space-between">
                    <Text size="lg">{season.seasonName}</Text>
                    <Group>
                        <Text c="dimmed">
                            {formatForViewerDate(season.startDate)} -{" "}
                            {formatForViewerDate(season.endDate)}
                        </Text>
                        <IconChevronRight size={20} />
                    </Group>
                    {getSeasonStatus(season)}
                </Group>

                {/* TODO: Add current or past record based on game results */}
            </Card>
        </Link>
    );

    if (!seasons.length) {
        return (
            <>
                {managerView && addSeasonCta}
                <Text mt="lg" align="center">
                    No seasons currently listed for this team.
                </Text>
            </>
        );
    }

    return (
        <>
            {managerView && addSeasonCta}
            <ScrollArea h="55vh">
                {inProgressSeasons.length > 0 && (
                    <>
                        <Text size="lg" fw={700} mt="md" c="dimmed">
                            In Progress
                        </Text>
                        {inProgressSeasons.map(renderSeason)}
                    </>
                )}
                {upcomingSeasons.length > 0 && (
                    <>
                        <Text size="lg" fw={700} mt="md" c="dimmed">
                            Upcoming
                        </Text>
                        {upcomingSeasons.map(renderSeason)}
                    </>
                )}

                {pastSeasons.length > 0 && (
                    <>
                        <Text size="lg" fw={700} mt="md" c="dimmed">
                            Past
                        </Text>
                        {pastSeasons.map(renderSeason)}
                    </>
                )}
            </ScrollArea>
        </>
    );
}
