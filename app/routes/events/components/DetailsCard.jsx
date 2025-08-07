import {
    Card,
    Divider,
    Group,
    Skeleton,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import {
    IconChevronRight,
    IconClock,
    IconCloudRain,
    IconMapPin,
} from '@tabler/icons-react';

import { formatGameTime, getGameDayStatus } from '@/utils/dateTime';

import DrawerContainer from '@/components/DrawerContainer';
import DeferredLoader from '@/components/DeferredLoader';

import ParkDetailsDrawer from './ParkDetailsDrawer';
import CalendarDetails from './CalendarDetails';

export default function DetailsCard({
    game,
    deferredData,
    season,
    team,
    weatherPromise,
}) {

    const {
        gameDate,
        timeZone,
    } = game;

    const formattedGameTime = formatGameTime(gameDate, timeZone);
    const gameDayStatus = getGameDayStatus(gameDate);
    const gameIsPast = gameDayStatus === 'past';

    const [locationDrawerOpened, locationDrawerHandlers] = useDisclosure(false);
    const [calendarDrawerOpened, calendarDrawerHandlers] = useDisclosure(false);
    const [weatherDrawerOpened, weatherDrawerHandlers] = useDisclosure(false);

    return (
        <>
            <Card withBorder radius="lg" mt="-12%" mx="md" py="5px">

                <Text size="sm" mt="xs">Date & Location Details</Text>

                <Card.Section my="xs" inheritPadding>
                    <Group justify="space-between" c="green" onClick={calendarDrawerHandlers.open}>
                        <Group gap="xs" c="green">
                            <IconClock size={18} />
                            {formattedGameTime}
                        </Group>
                        <IconChevronRight size={18} />
                    </Group>
                </Card.Section>

                <Divider />

                <Card.Section my="xs" inheritPadding>
                    <DeferredLoader
                        resolve={deferredData}
                        fallback={(
                            <>
                                <Group gap="xs">
                                    <IconMapPin size={18} />
                                    <Text>{season?.location || 'Loading location...'}</Text>
                                </Group>
                                <Skeleton height={16} width="70%" mt="5px" ml="28px" radius="xl" />
                            </>
                        )}
                        errorElement={<Text c="red" size="sm" ml="28px">Error loading location.</Text>}
                    >
                        {({ park }) => (
                            <>
                                {park?.googleMapsURI ? (
                                    <Group justify='space-between' onClick={locationDrawerHandlers.open} c="green">
                                        <Group gap="xs">
                                            <IconMapPin size={18} />
                                            {season?.location}
                                        </Group>
                                        <IconChevronRight size={18} />
                                    </Group>
                                ) : (
                                    <Group gap="xs">
                                        <IconMapPin size={18} />
                                        {season?.location || 'Location not specified'}
                                    </Group>
                                )}
                                <Text size="xs" mt="5px" ml="28px" c="dimmed">
                                    {park?.formattedAddress || 'Address not listed'}
                                </Text>
                            </>
                        )}
                    </DeferredLoader>
                </Card.Section>

                {!gameIsPast && (
                    <>
                        <Divider />

                        <Card.Section my="xs" inheritPadding>
                            <Group justify='space-between' onClick={weatherDrawerHandlers.open} c="green">
                                <Group gap="xs">
                                    <IconCloudRain size={18} />
                                    Gameday Forecast
                                </Group>
                                <IconChevronRight size={18} />
                            </Group>
                            <DeferredLoader
                                resolve={weatherPromise}
                                fallback={<Skeleton height={16} width="70%" mt="5px" ml="28px" radius="xl" />}
                                errorElement={<Text size="xs" mt="5px" ml="28px" c="red">Error loading weather details</Text>}
                            >
                                {(weather) => {
                                    return (
                                        <Text size="xs" mt="5px" ml="28px" c="dimmed">
                                            {!weather ? 'Data unavailable at this time' : 'Some weather summary here'}
                                        </Text>
                                    );
                                }}
                            </DeferredLoader>
                        </Card.Section>
                    </>
                )}
            </Card>

            <DeferredLoader resolve={deferredData} fallback={null}>
                {({ park }) => (
                    <>
                        <DrawerContainer
                            opened={calendarDrawerOpened}
                            onClose={calendarDrawerHandlers.close}
                            title="Add Game to Calendar"
                            size="sm"
                        >
                            <CalendarDetails
                                game={game}
                                park={park}
                                team={team}
                            />
                        </DrawerContainer>
                        {park && (
                            <DrawerContainer
                                opened={locationDrawerOpened}
                                onClose={locationDrawerHandlers.close}
                                title="Location Details"
                                size="sm"
                            >
                                <ParkDetailsDrawer park={park} />
                            </DrawerContainer>
                        )}
                    </>
                )}
            </DeferredLoader>

            <DeferredLoader resolve={weatherPromise}>
                {(weather) => {
                    return (
                        <DrawerContainer
                            opened={weatherDrawerOpened}
                            onClose={weatherDrawerHandlers.close}
                            title="Weather Details"
                            size="md"
                        >
                            {!weather ? (
                                <Text>Weather data is generally available starting seven days before the scheduled date. Please check back at a later time.</Text>
                            ) : JSON.stringify(weather)}
                        </DrawerContainer>
                    );
                }}
            </DeferredLoader>
        </>
    );
}