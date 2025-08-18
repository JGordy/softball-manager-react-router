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
    IconCloudRain,
    IconDropletHalf2Filled,
    IconSunFilled,
    IconNavigationFilled,
} from '@tabler/icons-react';

import CardSection from './CardSection';
import DeferredLoader from '@/components/DeferredLoader';
import DrawerContainer from '@/components/DrawerContainer';

import getGameDateWeather from '../utils/getGameDateWeather';
import getPrecipitationChanceRating from '../utils/getPrecipitationRating';
import getUvIndexColor from '../utils/getUvIndexColor';
import getWindSpeedRating from '../utils/getWindSpeedRating';

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
        <Card radius="xl" mb="lg">
            <Stack align="center" gap="xs">
                <Text ta="center">Rainout likelihood</Text>
                <Text fw={700} c={color} size="1.75rem" my={4}> {likelihood}%</Text>
                <Text size="xs" c="dimmed" ta="center" px="sm">{disclaimer}</Text>
                {reason && (
                    <Card className="inner-card" radius="xl" style={{ backgroundColor: 'var(--mantine-color-body)', width: '100%' }}>
                        <Text size="sm" ta="center">{reason}</Text>
                    </Card>
                )}
            </Stack>
        </Card>
    );
}

const renderWeatherDetails = ({
    feelsLikeTemperature,
    precipitation,
    rainout,
    temperature,
    weatherCondition,
    wind,
    uvIndex,
    totalPrecipitation,
    ...rest
}) => {

    const temp = Math.round(temperature.degrees);
    const feelsLike = Math.round(feelsLikeTemperature.degrees);
    const pop = (precipitation.probability.percent || 0) / 100;

    return (
        <>
            <Stack align="stretch" justify="space-between" mih={300}>
                {rainout && <RainoutChance {...rainout} />}

                <Card radius="xl">
                    <Text size="xs" c="dimmed" ta="center" mb="sm">
                        Forecast for the scheduled game time
                    </Text>
                    <Group align="center" justify="center">
                        <img src={`${weatherCondition.iconBaseUri}.svg`} width="50px" />
                        <div>
                            <Text size="lg">{weatherCondition.description.text}</Text>
                            <Text span>{temp}°F -</Text>
                            <Text c="dimmed" fs="italic" size="sm" span> Feels like {feelsLike}°F</Text>
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
                                <IconNavigationFilled size={20} style={{ transform: `rotate(${wind.direction.degrees + 180}deg)` }} />
                                <Text size="xl" fw={700} c={getWindSpeedRating(wind.speed.value).color}>{Math.round(wind.speed.value)} mph</Text>
                                <Text size="xs">wind</Text>
                            </Stack>

                            <Divider orientation="vertical" />

                            <Stack align="center" gap="3px" w="30%">
                                <IconSunFilled size={20} />
                                <Text size="xl" fw={700} c={getUvIndexColor(uvIndex)}>{Math.round(uvIndex)}</Text>
                                <Text size="xs">UV index</Text>
                            </Stack>
                        </Group>
                    </Card>
                </Card>

                <Group justify="center" mt="md" gap="5px">
                    <Text size="sm" c="dimmed" span>Weather details provided by </Text>
                    <Text size="sm" fw={700} span>
                        <a href="https://developers.google.com/maps/documentation/weather" target="_blank" rel="noreferrer">Google Weather</a>
                        &nbsp;
                    </Text>
                </Group>
            </Stack>
        </>
    );
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
                                const { hourly: gameDayWeather } = getGameDateWeather(gameDate, weather) || {};

                                let summary;
                                if (gameDayWeather) {
                                    summary = `${Math.round(gameDayWeather.temperature.degrees)}°F / ${gameDayWeather.precipitation.probability.percent}% chance of precipitation at game time`
                                }

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
                    const { hourly: gameDayWeather, rainout, totalPrecipitation } = getGameDateWeather(gameDate, weather) || {};

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
                            {!gameDayWeather ? weatherFallback : renderWeatherDetails({ ...gameDayWeather, totalPrecipitation, rainout })}
                        </DrawerContainer>
                    );
                }}
            </DeferredLoader>
        </>
    );
}