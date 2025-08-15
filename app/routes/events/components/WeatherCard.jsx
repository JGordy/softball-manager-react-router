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
        <Text c="dimmed" ta="center">Weather data is generally available starting seven days before the scheduled game date. Please check back at a later time.</Text>
    </Stack>
);

const RainoutChance = ({
    color,
    likelihood,
    reason,
}) => {

    const disclaimer = "This score is weighted based on the hourly forecast leading up to the game";

    return (
        <Card radius="xl" mb="xl">
            <Stack align="center" gap="xs">
                <Text ta="center">Rainout likelihood</Text>
                <Text fw={700} c={color} size="1.75rem" my={4}> {likelihood}%</Text>
                <Text size="xs" c="dimmed" ta="center" px="sm">{disclaimer}</Text>
                {reason && (
                    <Card className="inner-card" radius="xl" style={{ backgroundColor: 'var(--mantine-color-body)' }}>
                        <Text size="sm" ta="center">{reason}</Text>
                    </Card>
                )}
            </Stack>
        </Card>
    );
}

const renderWeatherDetails = ({
    feels_like,
    pop, // Percent chance of precipitation
    summary,
    temp,
    timeOfDay, // "day", "night", "eve", "morn", "max", "min"
    type, // "daily" or "hourly"
    weather,
    wind_deg,
    wind_speed,
    uvi, // UI index
    totalPrecipitation,
    ...rest
}) => {

    const _temp = Math.round(temp[timeOfDay] || temp);
    const _feels_like = Math.round(feels_like[timeOfDay] || feels_like);
    const main = weather[0]?.main;
    const mainWeatherKey = main.toLowerCase();
    const hasPrecipitation = (type === 'hourly' && (totalPrecipitation?.rain > 0 || totalPrecipitation?.snow > 0)) || (type === 'daily' && (rest.rain > 0 || rest.snow > 0));

    return (
        <>
            <Stack align="stretch" justify="space-between" mih="300">
                <Card radius="xl">
                    {type === 'hourly' && (
                        <Text size="xs" c="dimmed" ta="center" mb="sm">
                            Forecast for the scheduled game time
                        </Text>
                    )}
                    <Group align="center" justify="center">
                        {icons[mainWeatherKey]}
                        <div>
                            <Text size="lg">{weather[0]?.description}</Text>
                            <Text span>{_temp}°F -</Text>
                            <Text c="dimmed" fs="italic" size="sm" span> Feels like {_feels_like}°F</Text>
                        </div>
                    </Group>

                    <Card className="inner-card" mt="lg" radius="xl" style={{ backgroundColor: 'var(--mantine-color-body)' }}>
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

                {(summary || hasPrecipitation) && (
                    <Card radius="xl" my="md">
                        {summary && <Text ta="center">{summary}</Text>}
                        {type === 'hourly' && totalPrecipitation?.rain > 0 && (
                            <Text fw={700} ta="center">{`${Math.round((totalPrecipitation.rain / 25.4) * 100) / 100} total inches of rain`}</Text>
                        )}
                        {type === 'hourly' && totalPrecipitation?.snow > 0 && (
                            <Text fw={700} ta="center">{`${Math.round((totalPrecipitation.snow / 25.4) * 100) / 100} total inches of snow`}</Text>
                        )}
                        {type === 'daily' && rest.rain > 0 && (
                            <Text fw={700} ta="center">{`${Math.round((rest.rain / 25.4) * 100) / 100} daily inches of rain`}</Text>
                        )}
                        {type === 'daily' && rest.snow > 0 && (
                            <Text fw={700} ta="center">{`${Math.round((rest.snow / 25.4) * 100) / 100} daily inches of snow`}</Text>
                        )}
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
    if (!weather) return {};

    if (weather.daily) {
        return {
            gameDayWeather: getDailyWeather(weather.daily, gameDate),
            type: 'daily',
        };
    } else if (weather.hourly) {
        const { hourly, rainout, totalPrecipitation } = getHourlyWeather(weather.hourly, gameDate);

        return {
            gameDayWeather: hourly,
            rainout,
            type: 'hourly',
            totalPrecipitation,
        };
    }

    return {};
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

                                let summary;
                                if (gameDayWeather?.summary) {
                                    summary = gameDayWeather.summary;
                                }
                                if (gameDayWeather) {
                                    summary = `${Math.round(gameDayWeather?.temp)}°F / ${gameDayWeather.pop}% chance of precipitation at game time`
                                }

                                return (
                                    <Text size="xs" mt="5px" ml="28px" c="dimmed">
                                        {!weather ? 'Data unavailable at this time' : summary}
                                    </Text>
                                );
                            }}
                        </DeferredLoader>
                    )}
                />
            </Card>

            <DeferredLoader resolve={weatherPromise}>
                {(weather) => {
                    const { gameDayWeather, rainout, type, totalPrecipitation } = findWeatherForGameDate(gameDate, weather);

                    let drawerSize = 'md';
                    if (gameDayWeather) drawerSize = 'lg';
                    if (rainout) drawerSize = 'xl';

                    return (
                        <DrawerContainer
                            opened={weatherDrawerOpened}
                            onClose={weatherDrawerHandlers.close}
                            title="Weather Details"
                            size={drawerSize}
                        >
                            {rainout && <RainoutChance {...rainout} />}
                            {!weather ? weatherFallback : renderWeatherDetails({ ...gameDayWeather, type, totalPrecipitation })}
                        </DrawerContainer>
                    );
                }}
            </DeferredLoader>
        </>
    );
}