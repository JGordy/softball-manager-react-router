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
import getRainoutLikelihood from '../utils/getRainoutLikelihood';
import getUvIndexColor from '../utils/getUvIndexColor';
import getWindSpeedRating from '../utils/getWindSpeedRating';

const icons = {
    rain: <IconCloudRain size={60} />,
    snow: <IconSnowflake size={60} />,
    clouds: <IconCloudFilled size={60} />,
    clear: <IconSunFilled size={60} />,
    thunderstorm: <IconCloudStorm size={60} />,
}

const weatherFallback = (
    <Stack align="center">
        <IconCloudRain size={72} />
        <Text c="red">Weather data not yet available</Text>
        <Text c="dimmed">Weather data is generally available starting seven days before the scheduled game date. Please check back at a later time.</Text>
    </Stack>
);

const renderRainoutChance = ({ likelihood, color }) => {

    return (likelihood > 5) && (
        <Card radius="xl" mb="md">
            <Stack align="center" gap={0}>
                <Text>Rainout likelihood</Text>
                <Text fw={700} c={color} size="1.75rem" my="xs"> {likelihood}%</Text>
                <Text size="xs" c="dimmed" ta="center">
                    This score is weighted based on the hourly forecast leading up to the game.
                </Text>
            </Stack>
        </Card>
    );
}

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
    const mainWeatherKey = main.toLowerCase();
    const showPrecipTotals = ['rain', 'snow'].includes(mainWeatherKey);

    return (
        <>
            <Stack align="stretch" justify="space-between" mih="300">

                <Card radius="xl" pt="xl">
                    <Group align="center" justify="center">
                        {icons[mainWeatherKey]}
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

                {(summary || showPrecipTotals) && (
                    <Card radius="xl" my="md">
                        {summary && <Text align="center">{summary}</Text>}
                        {showPrecipTotals && <Text fw={700} align="center">{`${Math.round((rest[mainWeatherKey] / 25.4) * 100) / 100} daily inches`}</Text>}
                    </Card>
                )}

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

    if (weather.daily) {
        return { gameDayWeather: getDailyWeather(weather.daily, gameDate) };
    } else if (weather.hourly) {
        const { hourly, rainout } = getHourlyWeather(weather.hourly, gameDate);

        return {
            gameDayWeather: hourly,
            rainout,
        };
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
                                const { gameDayWeather } = findWeatherForGameDate(gameDate, weather);
                                const summary = gameDayWeather.summary ?? `${Math.round(gameDayWeather.temp)}°F / ${gameDayWeather.pop}% chance of precipitation at game time`;

                                return (
                                    <Text size="xs" mt="5px" ml="28px" c="dimmed">
                                        {!gameDayWeather ? 'Data unavailable at this time' : summary}
                                    </Text>
                                );
                            }}
                        </DeferredLoader>
                    )}
                />
            </Card>

            <DeferredLoader resolve={weatherPromise}>
                {(weather) => {
                    const { gameDayWeather, rainout } = findWeatherForGameDate(gameDate, weather);

                    return (
                        <DrawerContainer
                            opened={weatherDrawerOpened}
                            onClose={weatherDrawerHandlers.close}
                            title="Weather Details"
                            size={gameDayWeather ? 'lg' : 'md'}
                        >
                            {rainout && renderRainoutChance(rainout)}
                            {!gameDayWeather ? weatherFallback : renderWeatherDetails(gameDayWeather)}
                        </DrawerContainer>
                    );
                }}
            </DeferredLoader>
        </>
    );
}