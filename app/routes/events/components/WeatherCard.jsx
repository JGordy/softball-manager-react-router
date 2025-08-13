import {
    Card,
    Divider,
    Group,
    Skeleton,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import {
    IconSunset2,
    IconCloudFilled,
    IconCloudRain,
    IconCloudStorm,
    IconDropletHalf2Filled,
    IconSunFilled,
    IconNavigationFilled,
    IconSnowflake,
} from '@tabler/icons-react';

import CardSection from './CardSection';
import DeferredLoader from '@/components/DeferredLoader';
import DrawerContainer from '@/components/DrawerContainer';

import getDailyWeather from '../utils/getDailyWeather';
import getHourlyWeather from '../utils/getHourlyWeather';
import getPrecipitationChanceRating from '../utils/getPrecipitationRating';
import getUvIndexColor from '../utils/getUvIndexColor';
import getWindSpeedRating from '../utils/getWindSpeedRating';

const icons = {
    rain: <IconCloudRain size={48} />,
    snow: <IconSnowflake size={48} />,
    clouds: <IconCloudFilled size={48} />,
    clear: <IconSunFilled size={48} />,
    thunderstorm: <IconCloudStorm size={48} />,
}

const weatherFallback = (
    <Stack align="center">
        <IconCloudRain size={72} />
        <Text c="red">Weather data not yet available</Text>
        <Text c="dimmed">Weather data is generally available starting seven days before the scheduled game date. Please check back at a later time.</Text>
    </Stack>
);

const renderWeatherDetails = ({
    temp,
    feels_like,
    pop, // Percent chance of precipitation
    summary,
    timeOfDay, // "day", "night", "eve", "morn", "max", "min"
    weather,
    wind_deg,
    wind_speed,
    uvi, // UI index
    ...rest
}) => {

    const _temp = Math.round(temp[timeOfDay] || temp);
    const _feels_like = Math.round(feels_like[timeOfDay] || feels_like);
    const main = weather[0]?.main;

    return (
        <>
            <Stack align="stretch" justify="space-between" mih="300">

                <Card radius="xl" pt="xl">
                    <Group align="center" justify="center">
                        {icons[main.toLowerCase()]}
                        <div>
                            <Text size="lg">{weather[0]?.description}</Text>
                            <Text span>{_temp}°F -</Text>
                            <Text c="dimmed" fs="italic" size="sm" span> Feels like {_feels_like}°F</Text>
                        </div>
                    </Group>

                    <Card mt="lg" radius="xl" style={{ backgroundColor: 'var(--mantine-color-body)' }}>
                        <Group justify="space-around" gap="0">
                            <Stack align="center" gap="3px" w="30%">
                                <IconDropletHalf2Filled size={20} />
                                <Text size="xl" fw={700} c={getPrecipitationChanceRating(pop).color}>{pop * 100}%</Text>
                                <Text size="xs">precipitation</Text>
                            </Stack>

                            <Divider orientation="vertical" />

                            <Stack align="center" gap="3px" w="30%">
                                <IconNavigationFilled size={20} style={{ transform: `rotate(${wind_deg + 180}deg)` }} />
                                <Text size="xl" fw={700} c={getWindSpeedRating(wind_speed).color}>{Math.round(wind_speed)} mph</Text>
                                <Text size="xs">wind</Text>
                            </Stack>

                            <Divider orientation="vertical" />

                            <Stack align="center" gap="3px" w="30%">
                                <IconSunFilled size={20} />
                                <Text size="xl" fw={700} c={getUvIndexColor(uvi)}>{Math.round(uvi)}</Text>
                                <Text size="xs">UV index</Text>
                            </Stack>
                        </Group>
                    </Card>
                </Card>

                <Card radius="xl" my="md">
                    <Text align="center">{summary}</Text>
                    <Text fw={700} align="center">{`${Math.round((rest[main.toLowerCase()] / 25.4) * 100) / 100} total inches`}</Text>
                </Card>

                <Group justify="center" mt="md" gap="5px">
                    <Text size="sm" c="dimmed" span>Weather details provided by </Text>
                    <Text size="sm" fw={700} span>
                        <a href="https://openweathermap.org/" target="_blank" rel="noreferrer">OpenWeatherMap</a>
                        &nbsp;
                    </Text>
                </Group>
            </Stack>
        </>
    );
}

function findWeatherForGameDate(gameDate, weather) {
    if (!weather) return null;

    console.log({ gameDate, weather });

    if (weather.daily) {
        return getDailyWeather(weather.daily, gameDate);
    } else if (weather.hourly) {
        console.log({ hourly: weather.hourly });
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
                    console.log({ gameDayWeather });
                    return (
                        <DrawerContainer
                            opened={weatherDrawerOpened}
                            onClose={weatherDrawerHandlers.close}
                            title="Weather Details"
                            size={gameDayWeather ? 'lg' : 'md'}
                        >
                            {!gameDayWeather ? weatherFallback : renderWeatherDetails(gameDayWeather)}
                        </DrawerContainer>
                    );
                }}
            </DeferredLoader>
        </>
    );
}