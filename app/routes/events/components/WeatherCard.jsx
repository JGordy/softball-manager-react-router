import { useEffect, useState } from "react";
import {
    Button,
    Card,
    Divider,
    Group,
    Skeleton,
    Stack,
    Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import {
    IconSunset2,
    IconCloudRain,
    IconDropletHalf2Filled,
    IconSunFilled,
    IconNavigationFilled,
} from "@tabler/icons-react";

import CardSection from "./CardSection";
import DeferredLoader from "@/components/DeferredLoader";
import DrawerContainer from "@/components/DrawerContainer";
import InlineError from "@/components/InlineError";

import getGameDateWeather from "../utils/getGameDateWeather";
import getPrecipitationChanceRating from "../utils/getPrecipitationRating";
import getUvIndexColor from "../utils/getUvIndexColor";
import getWindSpeedRating from "../utils/getWindSpeedRating";

const weatherFallback = (
    <Stack align="center">
        <IconCloudRain size={72} />
        <Text c="red">Weather data not yet available</Text>
        <Text c="dimmed" ta="center">
            Weather data is generally available starting 4 days before the
            scheduled game date. Please check back at a later time.
        </Text>
    </Stack>
);

const RainoutChance = ({ color, likelihood, reason }) => {
    const disclaimer =
        "*Rainout score is weighted based on the hourly forecast leading up to the game and may not reflect actual conditions at the time of the game.";

    return (
        <>
            <Card radius="xl" mb="xs" mt="sm">
                <Stack align="center" gap="xs">
                    <Text size="lg" fw={700} ta="center">
                        Rainout likelihood*
                    </Text>
                    <Text fw={700} c={color} size="1.75rem" my={4}>
                        {" "}
                        {likelihood}%
                    </Text>
                    {reason && (
                        <Card
                            className="inner-card"
                            radius="xl"
                            style={{
                                backgroundColor: "var(--mantine-color-body)",
                                width: "100%",
                            }}
                        >
                            <Text size="sm" ta="center">
                                {reason}
                            </Text>
                        </Card>
                    )}
                </Stack>
            </Card>
            <Text size="xs" c="dimmed" ta="center" px="sm">
                {disclaimer}
            </Text>
        </>
    );
};

const renderWeatherDetails = ({
    feelsLikeTemperature,
    precipitation,
    rainout,
    temperature,
    weatherCondition,
    wind,
    uvIndex,
}) => {
    const temp = Math.round(temperature.degrees);
    const feelsLike = Math.round(feelsLikeTemperature.degrees);
    const pop = Math.round(precipitation.probability.percent || 0) / 100;

    return (
        <>
            <Stack align="stretch" justify="space-between" mih={300}>
                <Card radius="xl">
                    <Text size="lg" fw={700} ta="center" mb="md">
                        Game Time Forecast
                    </Text>
                    <Group align="center" justify="center">
                        <img
                            src={`${weatherCondition.iconBaseUri}.svg`}
                            width="50px"
                        />
                        <div>
                            <Text size="lg">
                                {weatherCondition.description.text}
                            </Text>
                            <Text span>{temp}°F -</Text>
                            <Text c="dimmed" fs="italic" size="sm" span>
                                {" "}
                                Feels like {feelsLike}°F
                            </Text>
                        </div>
                    </Group>

                    <Card
                        className="inner-card"
                        mt="lg"
                        radius="xl"
                        style={{ backgroundColor: "var(--mantine-color-body)" }}
                    >
                        <Group justify="space-around" gap="0">
                            <Stack align="center" gap="3px" w="30%">
                                <IconDropletHalf2Filled size={20} />
                                <Text
                                    size="xl"
                                    fw={700}
                                    c={getPrecipitationChanceRating(pop).color}
                                >
                                    {pop * 100}%
                                </Text>
                                <Text size="xs">precipitation</Text>
                            </Stack>

                            <Divider orientation="vertical" />

                            <Stack align="center" gap="3px" w="30%">
                                <IconNavigationFilled
                                    size={20}
                                    style={{
                                        transform: `rotate(${wind.direction.degrees + 180}deg)`,
                                    }}
                                />
                                <Text
                                    size="xl"
                                    fw={700}
                                    c={
                                        getWindSpeedRating(wind.speed.value)
                                            .color
                                    }
                                >
                                    {Math.round(wind.speed.value)} mph
                                </Text>
                                <Text size="xs">wind</Text>
                            </Stack>

                            <Divider orientation="vertical" />

                            <Stack align="center" gap="3px" w="30%">
                                <IconSunFilled size={20} />
                                <Text
                                    size="xl"
                                    fw={700}
                                    c={getUvIndexColor(uvIndex)}
                                >
                                    {Math.round(uvIndex)}
                                </Text>
                                <Text size="xs">UV index</Text>
                            </Stack>
                        </Group>
                    </Card>
                </Card>

                {rainout && <RainoutChance {...rainout} />}

                <Group justify="center" mt="md" gap="5px">
                    <Text size="sm" c="dimmed" span>
                        Weather details provided by{" "}
                    </Text>
                    <Text size="sm" fw={700} span>
                        <a
                            href="https://developers.google.com/maps/documentation/weather"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Google Weather
                        </a>
                        &nbsp;
                    </Text>
                </Group>
            </Stack>
        </>
    );
};

export default function WeatherCard({
    weatherPromise,
    gameDate,
    variant = "card",
    onClick,
}) {
    const [weatherDrawerOpened, weatherDrawerHandlers] = useDisclosure(false);
    const [drawerSize, setDrawerSize] = useState("md");

    useEffect(() => {
        let active = true;
        if (weatherPromise && typeof weatherPromise.then === "function") {
            weatherPromise
                .then((weather) => {
                    if (!active) return;
                    const { hourly: gameDayWeather, rainout } =
                        getGameDateWeather(gameDate, weather) || {};
                    let size = "md";
                    if (gameDayWeather) size = "lg";
                    if (rainout) size = "xl";
                    setDrawerSize(size);
                })
                .catch(() => {
                    if (!active) return;
                    setDrawerSize("md");
                });
        } else if (weatherPromise) {
            const { hourly: gameDayWeather, rainout } =
                getGameDateWeather(gameDate, weatherPromise) || {};
            let size = "md";
            if (gameDayWeather) size = "lg";
            if (rainout) size = "xl";
            setDrawerSize(size);
        }
        return () => {
            active = false;
        };
    }, [weatherPromise, gameDate]);

    if (variant === "badge") {
        return (
            <>
                <DeferredLoader
                    resolve={weatherPromise}
                    fallback={
                        <Skeleton
                            height={32}
                            width={110}
                            radius="xl"
                            style={{ flexShrink: 0 }}
                        />
                    }
                    errorElement={
                        <Button
                            variant="light"
                            color="red"
                            size="xs"
                            radius="xl"
                            onClick={(e) => {
                                weatherDrawerHandlers.open();
                                if (onClick) onClick(e);
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
                            ⚠️ Weather Error
                        </Button>
                    }
                >
                    {(weather) => {
                        const { hourly: gameDayWeather } =
                            getGameDateWeather(gameDate, weather) || {};

                        let summary = "No Forecast";
                        let icon = "☀️";

                        if (gameDayWeather) {
                            summary = `${Math.round(gameDayWeather.temperature.degrees)}°F / ${gameDayWeather.precipitation.probability.percent}%`;
                            const condition =
                                gameDayWeather.weatherCondition?.description?.text?.toLowerCase() ||
                                "";
                            if (
                                condition.includes("rain") ||
                                condition.includes("shower") ||
                                condition.includes("drizzle")
                            ) {
                                icon = "🌧️";
                            } else if (
                                condition.includes("cloud") ||
                                condition.includes("overcast")
                            ) {
                                icon = "☁️";
                            } else if (
                                condition.includes("snow") ||
                                condition.includes("ice")
                            ) {
                                icon = "❄️";
                            } else if (
                                condition.includes("thunder") ||
                                condition.includes("storm")
                            ) {
                                icon = "⛈️";
                            } else {
                                icon = "☀️";
                            }
                        }

                        return (
                            <Button
                                variant="filled"
                                color="blue"
                                size="xs"
                                radius="xl"
                                onClick={(e) => {
                                    weatherDrawerHandlers.open();
                                    if (onClick) onClick(e);
                                }}
                                leftSection={<span>{icon}</span>}
                                data-testid="weather-badge-button"
                                styles={{
                                    root: {
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        border: "1.5px solid var(--mantine-color-lime-5)",
                                        flexShrink: 0,
                                    },
                                }}
                            >
                                {summary}
                            </Button>
                        );
                    }}
                </DeferredLoader>

                <DrawerContainer
                    opened={weatherDrawerOpened}
                    onClose={weatherDrawerHandlers.close}
                    title="Weather Details"
                    size={drawerSize}
                >
                    <DeferredLoader
                        resolve={weatherPromise}
                        fallback={<Skeleton height={200} radius="xl" />}
                        errorElement={weatherFallback}
                    >
                        {(weather) => {
                            const {
                                hourly: gameDayWeather,
                                rainout,
                                totalPrecipitation,
                            } = getGameDateWeather(gameDate, weather) || {};

                            return !gameDayWeather
                                ? weatherFallback
                                : renderWeatherDetails({
                                      ...gameDayWeather,
                                      totalPrecipitation,
                                      rainout,
                                  });
                        }}
                    </DeferredLoader>
                </DrawerContainer>
            </>
        );
    }

    return (
        <>
            <Card radius="xl" mt="md" mx="md" py="5px">
                <CardSection
                    onClick={weatherDrawerHandlers.open}
                    heading="Gameday Forecast"
                    leftSection={<IconSunset2 size={20} />}
                    subHeading={
                        <DeferredLoader
                            resolve={weatherPromise}
                            fallback={
                                <Skeleton
                                    height={16}
                                    width="70%"
                                    mt="5px"
                                    ml="28px"
                                    radius="xl"
                                />
                            }
                            errorElement={
                                <InlineError
                                    message="Error loading weather details"
                                    mt="5px"
                                    ml="28px"
                                />
                            }
                        >
                            {(weather) => {
                                const { hourly: gameDayWeather } =
                                    getGameDateWeather(gameDate, weather) || {};

                                let summary;
                                if (gameDayWeather) {
                                    summary = `${Math.round(gameDayWeather.temperature.degrees)}°F / ${gameDayWeather.precipitation.probability.percent}% chance of precipitation at game time`;
                                }

                                return (
                                    <Text
                                        size="xs"
                                        mt="5px"
                                        ml="28px"
                                        c="dimmed"
                                    >
                                        {!gameDayWeather
                                            ? "Data unavailable at this time"
                                            : summary}
                                    </Text>
                                );
                            }}
                        </DeferredLoader>
                    }
                />
            </Card>

            <DeferredLoader resolve={weatherPromise} errorElement={null}>
                {(weather) => {
                    const {
                        hourly: gameDayWeather,
                        rainout,
                        totalPrecipitation,
                    } = getGameDateWeather(gameDate, weather) || {};

                    let drawerSize = "md";
                    if (gameDayWeather) drawerSize = "lg";
                    if (rainout) drawerSize = "xl";

                    return (
                        <DrawerContainer
                            opened={weatherDrawerOpened}
                            onClose={weatherDrawerHandlers.close}
                            title="Weather Details"
                            size={drawerSize}
                        >
                            {!gameDayWeather
                                ? weatherFallback
                                : renderWeatherDetails({
                                      ...gameDayWeather,
                                      totalPrecipitation,
                                      rainout,
                                  })}
                        </DrawerContainer>
                    );
                }}
            </DeferredLoader>
        </>
    );
}
