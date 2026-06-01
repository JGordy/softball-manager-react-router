import { Box, Button, Group, Skeleton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
    IconUsersGroup,
    IconTrophy,
    IconMapPin,
    IconCalendar,
} from "@tabler/icons-react";

import DeferredLoader from "@/components/DeferredLoader";

import addPlayerAvailability from "@/utils/addPlayerAvailability";
import { trackEvent } from "@/utils/analytics";

import DetailsCard from "./DetailsCard";
import GamedayCard from "./GamedayCard";
import WeatherCard from "./WeatherCard";
import RosterDetails from "./RosterDetails";
import AvailabilityDrawer from "./AvailabilityDrawer";
import EventCalendarDrawer from "./EventCalendarDrawer";
import EventLocationDrawer from "./EventLocationDrawer";
import styles from "./MobileEventDetailsView.module.css";

/**
 * MobileEventDetailsView Component
 * Renders the mobile event details page view using the Badge & Widget Hybrid layout.
 * Features a horizontal row of interactive badges at the top (Weather and Availability)
 * and rich widgets below (Gameday scoring, Lineup field chart centerpiece).
 *
 * @param {Object} props - Component props.
 * @param {Object} props.game - The active game document data.
 * @param {Object} props.deferredData - Deferrable data (attendance, players, etc.).
 * @param {Object} props.season - The active season document data.
 * @param {Object} props.team - The active team document data.
 * @param {Boolean} props.gameIsPast - Whether the game has already concluded.
 * @param {Boolean} props.gameInProgress - Whether the game is currently live/in progress.
 * @param {Boolean} props.isScorekeeper - Whether the current user is a scorekeeper.
 * @param {Promise} props.weatherPromise - The resolved weather forecast promise.
 * @param {Object} props.user - The logged-in user document.
 * @param {Function} props.onOpenAwards - Callback to open the Awards drawer.
 * @param {Boolean} props.managerView - Whether the current user is a team manager.
 * @param {Array} props.playerChart - The parsed and enriched player chart lineup.
 * @returns {React.ReactElement} The mobile event details layout view.
 */
export default function MobileEventDetailsView({
    game,
    deferredData,
    season,
    team,
    gameIsPast,
    gameInProgress,
    isScorekeeper,
    weatherPromise,
    onOpenAwards,
    managerView,
    playerChart,
}) {
    const [availabilityDrawerOpened, availabilityDrawerHandlers] =
        useDisclosure(false);
    const [calendarDrawerOpened, calendarDrawerHandlers] = useDisclosure(false);
    const [locationDrawerOpened, locationDrawerHandlers] = useDisclosure(false);

    return (
        <>
            <Box px="md" mt="-12%">
                <DetailsCard
                    game={game}
                    deferredData={deferredData}
                    season={season}
                    calendarDrawerHandlers={calendarDrawerHandlers}
                    locationDrawerHandlers={locationDrawerHandlers}
                />
            </Box>

            {/* Horizontal interactive badge/pill row */}
            <Group
                wrap="nowrap"
                gap="xs"
                pl={32}
                pr={24}
                mt="md"
                className={`${styles.badgeRow} tour-interactive-badge-row`}
            >
                {/* Weather Badge (for future games) */}
                {!gameIsPast && (
                    <WeatherCard
                        gameDate={game.gameDate}
                        weatherPromise={weatherPromise}
                        variant="badge"
                        onClick={() =>
                            trackEvent("view-weather-badge", {
                                eventId: game.$id,
                            })
                        }
                    />
                )}

                {/* Deferred Badges (Availability, Directions, Calendar) */}
                <DeferredLoader
                    resolve={deferredData}
                    fallback={
                        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                            <Skeleton
                                height={32}
                                width={110}
                                radius="xl"
                                style={{ flexShrink: 0 }}
                            />
                            <Skeleton
                                height={32}
                                width={100}
                                radius="xl"
                                style={{ flexShrink: 0 }}
                            />
                            <Skeleton
                                height={32}
                                width={120}
                                radius="xl"
                                style={{ flexShrink: 0 }}
                            />
                        </Group>
                    }
                    errorElement={
                        <Button
                            variant="light"
                            color="red"
                            size="xs"
                            radius="xl"
                            leftSection={<IconUsersGroup size={16} />}
                            onClick={() => {
                                availabilityDrawerHandlers.open();
                                trackEvent("view-availability-badge", {
                                    eventId: game.$id,
                                });
                            }}
                            styles={{
                                root: {
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    border: "1.5px solid var(--mantine-color-red-5)",
                                    flexShrink: 0,
                                },
                            }}
                        >
                            Error
                        </Button>
                    }
                >
                    {({ attendance, players, park }) => {
                        const { rows } = attendance;
                        const playersWithAvailability = addPlayerAvailability(
                            rows,
                            players,
                        );
                        const availablePlayers = playersWithAvailability.filter(
                            (p) => p.availability === "accepted",
                        );
                        const label = `${availablePlayers?.length || 0} Available`;
                        return (
                            <>
                                <Button
                                    variant="filled"
                                    color="blue"
                                    size="xs"
                                    radius="xl"
                                    className="tour-availability-badge"
                                    onClick={() => {
                                        availabilityDrawerHandlers.open();
                                        trackEvent("view-availability-badge", {
                                            eventId: game.$id,
                                        });
                                    }}
                                    leftSection={<IconUsersGroup size={16} />}
                                    data-testid="availability-badge-button"
                                    styles={{
                                        root: {
                                            cursor: "pointer",
                                            fontWeight: 600,
                                            border: "1.5px solid var(--mantine-color-lime-5)",
                                            flexShrink: 0,
                                        },
                                    }}
                                >
                                    {label}
                                </Button>

                                {park && (
                                    <Button
                                        variant="filled"
                                        color="blue"
                                        size="xs"
                                        radius="xl"
                                        className="tour-directions-badge"
                                        onClick={() => {
                                            locationDrawerHandlers.open();
                                            trackEvent(
                                                "view-directions-badge",
                                                { eventId: game.$id },
                                            );
                                        }}
                                        leftSection={<IconMapPin size={16} />}
                                        data-testid="directions-badge-button"
                                        styles={{
                                            root: {
                                                cursor: "pointer",
                                                fontWeight: 600,
                                                border: "1.5px solid var(--mantine-color-lime-5)",
                                                flexShrink: 0,
                                            },
                                        }}
                                    >
                                        {park.displayName ||
                                            game.location ||
                                            "Directions"}
                                    </Button>
                                )}

                                <Button
                                    variant="filled"
                                    color="blue"
                                    size="xs"
                                    radius="xl"
                                    className="tour-calendar-badge"
                                    onClick={() => {
                                        calendarDrawerHandlers.open();
                                        trackEvent("view-calendar-badge", {
                                            eventId: game.$id,
                                        });
                                    }}
                                    leftSection={<IconCalendar size={16} />}
                                    data-testid="calendar-badge-button"
                                    styles={{
                                        root: {
                                            cursor: "pointer",
                                            fontWeight: 600,
                                            border: "1.5px solid var(--mantine-color-lime-5)",
                                            flexShrink: 0,
                                        },
                                    }}
                                >
                                    Add to Calendar
                                </Button>
                            </>
                        );
                    }}
                </DeferredLoader>

                {/* Awards Badge (for past games) */}
                {gameIsPast && game.eventType !== "practice" && (
                    <Button
                        variant="filled"
                        color="blue"
                        size="xs"
                        radius="xl"
                        onClick={() => {
                            onOpenAwards();
                            trackEvent("view-awards-badge", {
                                eventId: game.$id,
                            });
                        }}
                        leftSection={<IconTrophy size={16} />}
                        data-testid="awards-badge-button"
                        styles={{
                            root: {
                                cursor: "pointer",
                                fontWeight: 600,
                                border: "1.5px solid var(--mantine-color-lime-5)",
                                flexShrink: 0,
                            },
                        }}
                    >
                        Awards
                    </Button>
                )}
            </Group>

            <Box px="md">
                {game.eventType !== "practice" && (
                    <GamedayCard
                        gameId={game.$id}
                        isLive={gameInProgress}
                        isPast={gameIsPast}
                        isScorekeeper={isScorekeeper}
                    />
                )}

                <RosterDetails
                    game={game}
                    managerView={managerView}
                    playerChart={playerChart}
                />
            </Box>

            {/* Availability Drawer */}
            <AvailabilityDrawer
                opened={availabilityDrawerOpened}
                onClose={availabilityDrawerHandlers.close}
                game={game}
                deferredData={deferredData}
                managerView={managerView}
                team={team}
            />

            {/* Add to Calendar Drawer */}
            <EventCalendarDrawer
                opened={calendarDrawerOpened}
                onClose={calendarDrawerHandlers.close}
                game={game}
                deferredData={deferredData}
                team={team}
            />

            {/* Location/Park Details Drawer */}
            <EventLocationDrawer
                opened={locationDrawerOpened}
                onClose={locationDrawerHandlers.close}
                deferredData={deferredData}
            />
        </>
    );
}
