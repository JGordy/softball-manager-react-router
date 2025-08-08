import {
    Card,
    Code,
    Skeleton,
    Stack,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { IconSunset2, IconCloudRain } from '@tabler/icons-react';

import CardSection from './CardSection';
import DeferredLoader from '@/components/DeferredLoader';
import DrawerContainer from '@/components/DrawerContainer';

const weatherFallback = (
    <Stack align="center">
        <IconCloudRain size={72} />
        <Text c="red">Weather data not yet available</Text>
        <Text c="dimmed">Weather data is generally available starting seven days before the scheduled game date. Please check back at a later time.</Text>
    </Stack>
);

const renderWeatherDetails = (weather) => {
    return (
        <>
            <Code color="transparent" block>{JSON.stringify(weather, null, 2)}</Code>
        </>
    );
}

function findWeatherForGameDate(gameDate, weather) {
    if (!weather) return null;

    const data = weather.daily || weather.hourly || null;
    if (!data) return null;

    const gameDateObj = new Date(gameDate);
    const gameDayString = gameDateObj.toISOString().split('T')[0];

    return data.find(dailyWeather => {
        const weatherDate = new Date(dailyWeather.dt * 1000);
        const weatherDayString = weatherDate.toISOString().split('T')[0];
        return gameDayString === weatherDayString;
    });
}

export default function WeatherCard({ weatherPromise, gameDate }) {

    const [weatherDrawerOpened, weatherDrawerHandlers] = useDisclosure(false);

    return (
        <>
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
                                const gameDayWeather = findWeatherForGameDate(gameDate, weather);
                                console.log({ gameDayWeather });
                                return (
                                    <Text size="xs" mt="5px" ml="28px" c="dimmed">
                                        {!gameDayWeather ? 'Data unavailable at this time' : gameDayWeather.summary}
                                    </Text>
                                );
                            }}
                        </DeferredLoader>
                    )}
                />
            </Card>

            <DeferredLoader resolve={weatherPromise}>
                {(weather) => {
                    const gameDayWeather = findWeatherForGameDate(gameDate, weather);
                    return (
                        <DrawerContainer
                            opened={weatherDrawerOpened}
                            onClose={weatherDrawerHandlers.close}
                            title="Weather Details"
                            size="md"
                        >
                            {!gameDayWeather ? weatherFallback : renderWeatherDetails(gameDayWeather)}
                        </DrawerContainer>
                    );
                }}
            </DeferredLoader>
        </>
    );
}