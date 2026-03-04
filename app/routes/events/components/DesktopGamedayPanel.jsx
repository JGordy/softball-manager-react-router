import { useNavigate } from "react-router";
import {
    Badge,
    Button,
    Card,
    Divider,
    Group,
    Skeleton,
    Stack,
    Text,
    ThemeIcon,
} from "@mantine/core";
import {
    IconActivity,
    IconArrowRight,
    IconClipboardData,
    IconCloudOff,
    IconScoreboard,
} from "@tabler/icons-react";

import DeferredLoader from "@/components/DeferredLoader";
import InlineError from "@/components/InlineError";

import getGameDateWeather from "../utils/getGameDateWeather";
import getPrecipitationChanceRating from "../utils/getPrecipitationRating";
import getWindSpeedRating from "../utils/getWindSpeedRating";

// Compact weather stat cell
function WeatherStat({ value, label, color }) {
    return (
        <Stack align="center" gap={2} style={{ flex: 1 }}>
            <Text size="lg" fw={700} c={color}>
                {value}
            </Text>
            <Text size="xs" c="dimmed">
                {label}
            </Text>
        </Stack>
    );
}

// Stand-alone weather forecast card — used both inline and in the Weather tab
function WeatherForecastCard({ weatherPromise, gameDate }) {
    return (
        <Card withBorder radius="lg" p="xl">
            <Text size="xs" tt="uppercase" fw={600} c="dimmed" ls={1} mb="md">
                Gameday Forecast
            </Text>

            <DeferredLoader
                resolve={weatherPromise}
                fallback={
                    <Group justify="space-around">
                        <Skeleton height={44} width="30%" radius="md" />
                        <Skeleton height={44} width="30%" radius="md" />
                        <Skeleton height={44} width="30%" radius="md" />
                    </Group>
                }
                errorElement={
                    <InlineError message="Error loading weather details" />
                }
            >
                {(weather) => {
                    const { hourly: gameDayWeather } =
                        getGameDateWeather(gameDate, weather) || {};

                    if (!gameDayWeather) {
                        return (
                            <Stack align="center" gap="xs" py="xl">
                                <ThemeIcon
                                    size={56}
                                    radius="xl"
                                    variant="light"
                                    color="gray"
                                >
                                    <IconCloudOff size={30} />
                                </ThemeIcon>
                                <Text size="sm" fw={600} c="dimmed" mt="xs">
                                    No forecast available yet
                                </Text>
                                <Text
                                    size="xs"
                                    c="dimmed"
                                    ta="center"
                                    maw={260}
                                >
                                    Weather data is typically available 7–10
                                    days before game day.
                                </Text>
                            </Stack>
                        );
                    }

                    const temp = Math.round(gameDayWeather.temperature.degrees);
                    const feelsLike = Math.round(
                        gameDayWeather.feelsLikeTemperature.degrees,
                    );
                    const pop =
                        Math.round(
                            gameDayWeather.precipitation.probability.percent ||
                                0,
                        ) / 100;
                    const wind = Math.round(gameDayWeather.wind.speed.value);
                    const { weatherCondition } = gameDayWeather;

                    const precipColor = getPrecipitationChanceRating(pop).color;
                    const windColor = getWindSpeedRating(wind).color;

                    return (
                        <>
                            <Group align="center" gap="sm" mb="md">
                                <img
                                    src={`${weatherCondition.iconBaseUri}.svg`}
                                    width="36px"
                                    alt="weather icon"
                                />
                                <div>
                                    <Text size="sm" fw={600}>
                                        {weatherCondition.description.text}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        {temp}°F · Feels like {feelsLike}°F
                                    </Text>
                                </div>
                            </Group>

                            <Divider mb="md" />

                            <Group justify="space-around" gap={0}>
                                <WeatherStat
                                    value={`${pop * 100}%`}
                                    label="Precip"
                                    color={precipColor}
                                />
                                <Divider orientation="vertical" />
                                <WeatherStat
                                    value={`${wind} mph`}
                                    label="Wind"
                                    color={windColor}
                                />
                                <Divider orientation="vertical" />
                                <WeatherStat
                                    value={`${Math.round(gameDayWeather.uvIndex)}`}
                                    label="UV Index"
                                />
                            </Group>
                        </>
                    );
                }}
            </DeferredLoader>
        </Card>
    );
}

export default function DesktopGamedayPanel({
    gameId,
    gameInProgress,
    gameIsPast,
    canScore,
    weatherPromise,
    gameDate,
    weatherOnly = false,
    showWeather = true,
}) {
    const navigate = useNavigate();

    let titleLabel = "Gameday Hub";
    let actionLabel = canScore ? "Score the Game" : "Follow The Action";
    let actionDesc = canScore
        ? "Access real-time scoring, stats, and play-by-play."
        : "Follow the game with live updates and box scores.";
    let ActionIcon = IconScoreboard;

    if (gameIsPast) {
        titleLabel = "Gameday Recap";
        actionLabel = "View Stats & Recap";
        actionDesc = "Check out the play-by-play and final box score.";
        ActionIcon = IconClipboardData;
    } else if (gameInProgress) {
        titleLabel = "Ongoing Gameday";
        actionLabel = canScore ? "Score this Game" : "Follow the Action";
        actionDesc = canScore
            ? "Keep the book updated with real-time stats."
            : "Watch the play-by-play unfold in real-time.";
    }

    // weatherOnly mode — just the forecast card, used in the Weather tab
    if (weatherOnly) {
        if (gameIsPast) return null;
        return (
            <WeatherForecastCard
                weatherPromise={weatherPromise}
                gameDate={gameDate}
            />
        );
    }

    return (
        <Stack gap="md" data-testid="desktop-gameday-panel">
            {/* Gameday Hub tile */}
            <Card
                withBorder
                radius="lg"
                p="xl"
                bg={
                    gameInProgress
                        ? "var(--mantine-color-lime-light)"
                        : undefined
                }
                style={
                    gameInProgress
                        ? { borderColor: "var(--mantine-color-lime-outline)" }
                        : {}
                }
            >
                <Group justify="space-between" mb="sm" align="center">
                    <Text
                        size="xs"
                        tt="uppercase"
                        fw={600}
                        ls={1}
                        c={gameInProgress ? "lime" : "dimmed"}
                    >
                        {titleLabel}
                    </Text>
                    {gameInProgress && (
                        <Badge
                            color="lime"
                            variant="filled"
                            size="sm"
                            leftSection={<IconActivity size={12} />}
                        >
                            LIVE NOW
                        </Badge>
                    )}
                </Group>

                <Group justify="space-between" align="center" wrap="nowrap">
                    <Group gap="sm" align="center" wrap="nowrap">
                        <ActionIcon
                            size={24}
                            color="var(--mantine-color-lime-5)"
                            style={{ flexShrink: 0 }}
                        />
                        <div>
                            <Text fw={700} c="lime" size="md">
                                {actionLabel}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {actionDesc}
                            </Text>
                        </div>
                    </Group>
                    <Button
                        variant={gameInProgress ? "filled" : "light"}
                        color="lime"
                        size="sm"
                        rightSection={<IconArrowRight size={16} />}
                        onClick={() => navigate(`/events/${gameId}/gameday`)}
                        style={{ flexShrink: 0 }}
                    >
                        {gameIsPast
                            ? "View Recap"
                            : canScore
                              ? "Score"
                              : "Follow"}
                    </Button>
                </Group>
            </Card>

            {/* Inline weather strip — future/live games only, when not suppressed */}
            {!gameIsPast && showWeather && (
                <WeatherForecastCard
                    weatherPromise={weatherPromise}
                    gameDate={gameDate}
                />
            )}
        </Stack>
    );
}
