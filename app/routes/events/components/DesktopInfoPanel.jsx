import { useDisclosure } from "@mantine/hooks";
import {
    Badge,
    Button,
    Card,
    Divider,
    Group,
    Skeleton,
    Text,
} from "@mantine/core";

import {
    IconAward,
    IconCalendarPlus,
    IconClock,
    IconExternalLink,
    IconMapPin,
} from "@tabler/icons-react";

import DeferredLoader from "@/components/DeferredLoader";
import DrawerContainer from "@/components/DrawerContainer";
import InlineError from "@/components/InlineError";

import { formatGameTime } from "@/utils/dateTime";

import CalendarDetails from "./CalendarDetails";
import ParkDetailsDrawer from "./ParkDetailsDrawer";
import AwardsDrawerContents from "./AwardsDrawerContents";
import { isUserAwardWinner } from "@/utils/awards";

export default function DesktopInfoPanel({
    game,
    deferredData,
    season,
    team,
    gameIsPast,
    user,
}) {
    const { gameDate, timeZone } = game;
    const formattedGameTime = formatGameTime(gameDate, timeZone);

    const [calendarOpened, calendarHandlers] = useDisclosure(false);
    const [locationOpened, locationHandlers] = useDisclosure(false);
    const [awardsOpened, awardsHandlers] = useDisclosure(false);

    return (
        <>
            <Card
                withBorder
                radius="lg"
                p="xl"
                data-testid="desktop-info-panel"
            >
                <Text
                    size="xs"
                    tt="uppercase"
                    fw={600}
                    c="dimmed"
                    ls={1}
                    mb="md"
                >
                    Event Details
                </Text>

                {/* Date/Time Row */}
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group
                        gap="sm"
                        align="flex-start"
                        wrap="nowrap"
                        style={{ flex: 1 }}
                    >
                        <IconClock
                            size={18}
                            color="var(--mantine-color-lime-5)"
                            style={{ marginTop: 2, flexShrink: 0 }}
                        />
                        <div>
                            <Text fw={600} size="sm" c="lime">
                                {formattedGameTime}
                            </Text>
                            <Text size="xs" c="dimmed">
                                Game time
                            </Text>
                        </div>
                    </Group>
                    <Button
                        variant="subtle"
                        size="compact-sm"
                        leftSection={<IconCalendarPlus size={14} />}
                        onClick={calendarHandlers.open}
                    >
                        Add to Calendar
                    </Button>
                </Group>

                <Divider my="md" />

                {/* Location Row */}
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group
                        gap="sm"
                        align="flex-start"
                        wrap="nowrap"
                        style={{ flex: 1 }}
                    >
                        <IconMapPin
                            size={18}
                            color="var(--mantine-color-lime-5)"
                            style={{ marginTop: 2, flexShrink: 0 }}
                        />
                        <div>
                            <Text fw={600} size="sm" c="lime">
                                {game?.location ||
                                    season?.location ||
                                    "Location TBD"}
                            </Text>
                            <DeferredLoader
                                resolve={deferredData}
                                fallback={
                                    <Skeleton
                                        height={12}
                                        width="80%"
                                        mt={4}
                                        radius="xl"
                                    />
                                }
                                errorElement={
                                    <InlineError message="Address unavailable" />
                                }
                            >
                                {({ park }) => (
                                    <Text size="xs" c="dimmed" mt={2}>
                                        {park?.formattedAddress ||
                                            game?.location ||
                                            season?.location ||
                                            "No address listed"}
                                    </Text>
                                )}
                            </DeferredLoader>
                            {game?.locationNotes && (
                                <Text size="xs" c="blue" mt={2} fw={500}>
                                    {game.locationNotes}
                                </Text>
                            )}
                        </div>
                    </Group>
                    <DeferredLoader
                        resolve={deferredData}
                        fallback={null}
                        errorElement={null}
                    >
                        {({ park }) =>
                            park?.googleMapsURI ? (
                                <Button
                                    variant="subtle"
                                    size="compact-sm"
                                    leftSection={<IconExternalLink size={14} />}
                                    onClick={locationHandlers.open}
                                >
                                    Map
                                </Button>
                            ) : null
                        }
                    </DeferredLoader>
                </Group>

                {/* Awards section — past games only */}
                {gameIsPast && (
                    <>
                        <Divider my="md" />
                        <Group
                            justify="space-between"
                            align="center"
                            wrap="nowrap"
                        >
                            <Group gap="sm" align="center" wrap="nowrap">
                                <IconAward
                                    size={18}
                                    color="var(--mantine-color-lime-5)"
                                    style={{ flexShrink: 0 }}
                                />
                                <div>
                                    <Text fw={600} size="sm" c="lime">
                                        Awards &amp; Recognition
                                    </Text>
                                    <DeferredLoader
                                        resolve={deferredData}
                                        fallback={
                                            <Skeleton
                                                height={12}
                                                width="60%"
                                                mt={4}
                                                radius="xl"
                                            />
                                        }
                                        errorElement={null}
                                    >
                                        {({ awards, votes }) => {
                                            const awardsTotal =
                                                awards?.total ?? 0;
                                            const votesTotal =
                                                votes?.total ?? 0;
                                            const userId = user?.$id;
                                            const userAward = isUserAwardWinner(
                                                userId,
                                                awards,
                                                votes,
                                            );

                                            let message = "Awards unavailable";
                                            let color = "dimmed";
                                            if (userAward) {
                                                message =
                                                    "You received an award!";
                                                color = "orange";
                                            } else if (awardsTotal > 0) {
                                                message =
                                                    "Awards ready to view";
                                                color = "yellow";
                                            } else if (votesTotal > 0) {
                                                message = "Voting in progress";
                                                color = "blue";
                                            }

                                            return (
                                                <Badge
                                                    color={
                                                        color === "dimmed"
                                                            ? "gray"
                                                            : color
                                                    }
                                                    variant="light"
                                                    size="sm"
                                                    mt={4}
                                                >
                                                    {message}
                                                </Badge>
                                            );
                                        }}
                                    </DeferredLoader>
                                </div>
                            </Group>
                            <Button
                                variant="subtle"
                                size="compact-sm"
                                onClick={awardsHandlers.open}
                            >
                                View
                            </Button>
                        </Group>
                    </>
                )}
            </Card>

            {/* Calendar drawer */}
            <DeferredLoader
                resolve={deferredData}
                fallback={null}
                errorElement={null}
            >
                {({ park }) => (
                    <DrawerContainer
                        opened={calendarOpened}
                        onClose={calendarHandlers.close}
                        title="Add Game to Calendar"
                        size="sm"
                    >
                        <CalendarDetails game={game} park={park} team={team} />
                    </DrawerContainer>
                )}
            </DeferredLoader>

            {/* Location drawer */}
            <DeferredLoader
                resolve={deferredData}
                fallback={null}
                errorElement={null}
            >
                {({ park }) =>
                    park ? (
                        <DrawerContainer
                            opened={locationOpened}
                            onClose={locationHandlers.close}
                            title="Location Details"
                            size="sm"
                        >
                            <ParkDetailsDrawer park={park} />
                        </DrawerContainer>
                    ) : null
                }
            </DeferredLoader>

            {/* Awards drawer */}
            {gameIsPast && (
                <DeferredLoader
                    resolve={deferredData}
                    fallback={null}
                    errorElement={null}
                >
                    {(deferred) => (
                        <DrawerContainer
                            opened={awardsOpened}
                            onClose={awardsHandlers.close}
                            title="Awards & Recognition"
                            size="95%"
                        >
                            <AwardsDrawerContents
                                game={game}
                                team={team}
                                user={user}
                                {...deferred}
                            />
                        </DrawerContainer>
                    )}
                </DeferredLoader>
            )}
        </>
    );
}
