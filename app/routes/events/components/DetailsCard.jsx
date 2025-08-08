import {
    Card,
    Divider,
    Group,
    Skeleton,
    Stack,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import {
    IconChevronRight,
    IconClock,
    IconCloudRain,
    IconMapPin,
    IconSunset2,
} from '@tabler/icons-react';

import { formatGameTime, getGameDayStatus } from '@/utils/dateTime';

import DrawerContainer from '@/components/DrawerContainer';
import DeferredLoader from '@/components/DeferredLoader';

import ParkDetailsDrawer from './ParkDetailsDrawer';
import CalendarDetails from './CalendarDetails';
import CardSection from './CardSection';

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

                <CardSection
                    onClick={calendarDrawerHandlers.open}
                    heading={formattedGameTime}
                    leftSection={<IconClock size={20} />}
                />

                <Divider />

                <CardSection
                    onClick={locationDrawerHandlers.open}
                    heading={season?.location || 'Loading location...'}
                    leftSection={<IconMapPin size={20} />}
                    subHeading={(
                        <DeferredLoader
                            resolve={deferredData}
                            fallback={<Skeleton height={16} width="70%" mt="5px" ml="28px" radius="xl" />}
                        >
                            {({ park }) => (
                                <>
                                    {park?.googleMapsURI ? (
                                        <Text size="xs" mt="5px" ml="28px" c="dimmed">{park?.formattedAddress || 'Address not listed'}</Text>
                                    ) : (
                                        <Text size="xs" mt="5px" ml="28px" c="dimmed">{season?.location || 'Location not specified'}</Text>
                                    )}
                                </>
                            )}
                        </DeferredLoader>
                    )}
                />
            </Card>

            {!gameIsPast && (
                <Card withBorder radius="xl" mt="md" mx="md" py="5px">
                    <CardSection
                        onClick={weatherDrawerHandlers.open}
                        heading="Gameday Forecast"
                        leftSection={<IconSunset2 size={20} />}
                        subHeading={(
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
                        )}
                    />
                </Card>
            )}

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
                                <Stack align="center">
                                    <IconCloudRain size={72} />
                                    <Text c="red">Weather data not yet available</Text>
                                    <Text c="dimmed">Weather data is generally available starting seven days before the scheduled game date. Please check back at a later time.</Text>
                                </Stack>
                            ) : JSON.stringify(weather)}
                        </DrawerContainer>
                    );
                }}
            </DeferredLoader>
        </>
    );
}