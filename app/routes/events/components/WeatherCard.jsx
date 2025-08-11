import {
    Card,
    Code,
    Group,
    Skeleton,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { IconSunset2, IconCloudRain } from '@tabler/icons-react';

import CardSection from './CardSection';
import DeferredLoader from '@/components/DeferredLoader';
import DrawerContainer from '@/components/DrawerContainer';

import getDailyWeather from '../utils/getDailyWeather';
import getHourlyWeather from '../utils/getHourlyWeather';

const weatherFallback = (
    <Stack align="center">
        <IconCloudRain size={72} />
        <Text c="red">Weather data not yet available</Text>
        <Text c="dimmed">Weather data is generally available starting seven days before the scheduled game date. Please check back at a later time.</Text>
    </Stack>
);

const renderWeatherDetails = (weather) => {
    const { timeOfDay } = weather;
    return (
        <>
            {/* <Code color="transparent" block>{JSON.stringify(weather, null, 2)}</Code> */}
            <Group align="start">
                <Title order={1}>{Math.round(weather.temp[timeOfDay])}°F</Title>
                <Text c="dimmed" fs="italic" mt="6px">Feels like {Math.round(weather.feels_like[timeOfDay])}°F</Text>
            </Group>
            <Group mt="xs">
                <Text>{weather.pop * 100}% chance of {weather.weather[0]?.description}</Text>
                <Text>{Math.round((weather.rain / 25.4) * 100) / 100} inches</Text>
            </Group>
            <Group mt="md" gap="5px">
                <Text size="sm" c="dimmed" span>Weather details powered by </Text>
                <Text size="sm" fw={700} span>
                    <a href="https://openweathermap.org/" target="_blank" rel="noreferrer">OpenWeatherMap</a>
                    &nbsp;
                </Text>
            </Group>
        </>
    );
}

function findWeatherForGameDate(gameDate, weather) {
    if (!weather) return null;

    console.log({ gameDate, weather });

    if (weather.daily) {
        return getDailyWeather(weather.daily, gameDate);
    } else if (weather.hourly) {
        return getHourlyWeather(weather.hourly, gameDate)
    }

    return null;
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