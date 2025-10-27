import { useState, useRef } from "react";

import {
    ActionIcon,
    Button,
    Divider,
    Group,
    Highlight,
    LoadingOverlay,
    Select,
    Text,
} from "@mantine/core";

import { TimeInput } from "@mantine/dates";
import { IconClock } from "@tabler/icons-react";

import GamesTable from "@/components/GamesTable";

import timeZones from "@/constants/timeZones";

import { getUserTimeZone } from "@/utils/dateTime";
import { DateTime } from "luxon";

import FormWrapper from "./FormWrapper";

import classes from "@/styles/inputs.module.css";

export default function GenerateSeasonGames({
    action = "add-games",
    actionRoute,
    season,
}) {
    const ref = useRef(null);

    const currentTimeZone = getUserTimeZone();

    const [gameTimes, setGameTimes] = useState(() => {
        // Use Luxon DateTime to represent the default time (7:00 PM) in the
        // user's current timezone. We'll store a DateTime instance.
        return DateTime.now()
            .setZone(currentTimeZone)
            .set({ hour: 19, minute: 0, second: 0, millisecond: 0 });
    });

    const [isLoading, setIsLoading] = useState(false);

    // Used for games generated but not yet saved/confirmed
    const [generatedGames, setGeneratedGames] = useState([]);

    const seasonStartDate = DateTime.fromISO(season.startDate, { zone: "utc" })
        .setZone(currentTimeZone)
        .toLocaleString();
    const seasonEndDate = DateTime.fromISO(season.endDate, { zone: "utc" })
        .setZone(currentTimeZone)
        .toLocaleString();

    const handleGenerateGamesClick = () => {
        setIsLoading(true);

        // Use Luxon's `toFormat('cccc')` to get the full weekday name (e.g.
        // "Monday") for robust day comparisons.

        // generate games
        const { gameDays = [], startDate, endDate, teamId } = season;

        const gameDaysList = (
            Array.isArray(gameDays) ? gameDays : String(gameDays).split(",")
        )
            .map((g) => String(g).trim())
            .filter(Boolean);

        const start = DateTime.fromISO(startDate, { zone: "utc" })
            .setZone(currentTimeZone)
            .startOf("day");
        const end = DateTime.fromISO(endDate, { zone: "utc" })
            .setZone(currentTimeZone)
            .endOf("day");

        const games = [];

        for (const gameDay of gameDaysList) {
            let currentDate = start;

            // Extract hour and minute from the DateTime stored in gameTimes
            const hours = gameTimes.hour;
            const minutes = gameTimes.minute;

            while (currentDate <= end) {
                const dayName = currentDate
                    .setZone(currentTimeZone)
                    .toFormat("cccc");
                const normalizedGameDay = String(gameDay).trim();
                if (dayName.toLowerCase() === normalizedGameDay.toLowerCase()) {
                    // Build a DateTime in the user's timezone for this date at the selected time,
                    // then convert to UTC ISO for storage.
                    const dt = currentDate
                        .set({
                            hour: hours,
                            minute: minutes,
                            second: 0,
                            millisecond: 0,
                        })
                        .setZone(currentTimeZone);
                    games.push({
                        gameDate: dt.toUTC().toISO(),
                        teamId,
                        seasonId: season.$id,
                        seasons: season.$id,
                    });
                }
                currentDate = currentDate.plus({ days: 1 }); // Increment by one day
            }
        }

        setTimeout(() => setGeneratedGames(games), 300);
        setTimeout(() => setIsLoading(false), 500);
    };

    const handleResetGames = () => {
        setGeneratedGames([]);
    };

    const handleSetGameTimesChange = (value) => {
        // Mantine TimeInput may provide a Date or a string depending on config.
        // Normalize to a Luxon DateTime in the user's timezone.
        if (!value) {
            setGameTimes(null);
            return;
        }

        let selectedDt;
        if (typeof value === "string") {
            // Expect format like "HH:mm"
            const [hours, minutes] = value.split(":");
            selectedDt = DateTime.now()
                .setZone(currentTimeZone)
                .set({
                    hour: parseInt(hours, 10),
                    minute: parseInt(minutes, 10),
                    second: 0,
                    millisecond: 0,
                });
        } else if (value instanceof Date) {
            selectedDt = DateTime.fromJSDate(value).setZone(currentTimeZone);
        } else if (DateTime.isDateTime(value)) {
            selectedDt = value.setZone(currentTimeZone);
        } else {
            // Fallback: try to coerce
            selectedDt = DateTime.fromISO(String(value)).setZone(
                currentTimeZone,
            );
        }

        setGameTimes(selectedDt);

        // Update generated games with the new time
        if (generatedGames.length > 0) {
            setGeneratedGames((prevGames) => {
                return prevGames.map((game) => {
                    const gameDt = DateTime.fromISO(game.gameDate, {
                        zone: "utc",
                    }).setZone(currentTimeZone);
                    const updated = gameDt.set({
                        hour: selectedDt.hour,
                        minute: selectedDt.minute,
                        second: 0,
                        millisecond: 0,
                    });
                    return {
                        ...game,
                        gameDate: updated.toUTC().toISO(), // Update gameDate with new time
                    };
                });
            });
        }
    };

    const pickerControl = (
        <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => ref.current?.showPicker()}
        >
            <IconClock size={16} stroke={1.5} />
        </ActionIcon>
    );

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            pos="relative"
            hideButtons={!generatedGames.length}
            confirmText="Save Games"
            cancelText="Clear Games"
            onCancelClick={handleResetGames}
        >
            <LoadingOverlay
                visible={isLoading}
                zIndex={1000}
                overlayProps={{ radius: "sm", blur: 3 }}
            />
            <Highlight
                highlight={[
                    `${season.gameDays}`,
                    `${seasonStartDate}`,
                    `${seasonEndDate}`,
                    `${gameTimes ? gameTimes.toLocaleString(DateTime.TIME_SIMPLE) : ""}`,
                ]}
                highlightStyles={{
                    // backgroundColor: 'green',
                    backgroundImage:
                        "linear-gradient(45deg, var(--mantine-color-cyan-5), var(--mantine-color-green-6))",
                    fontWeight: 700,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                }}
            >
                {`Create placeholder games for every ${season.gameDays} between ${seasonStartDate} and ${seasonEndDate} @ ${gameTimes ? gameTimes.toFormat("h:mm a") : ""}?`}
            </Highlight>
            <Divider size="sm" my="sm" />
            <TimeInput
                label="Game Times"
                placeholder="Select a default start time for your games "
                ref={ref}
                rightSection={pickerControl}
                onChange={handleSetGameTimesChange}
                format="24"
                mb="sm"
                defaultValue="19:00"
                radius="md"
            />
            <Select
                className={classes.inputs}
                label="Time Zone"
                name="timeZone"
                description="Select time zone if game is not in your current time zone (Uncommon)"
                data={timeZones}
                defaultValue={currentTimeZone}
                mb="sm"
                searchable
                radius="md"
            />
            <input
                type="hidden"
                name="games"
                value={JSON.stringify(generatedGames)}
            />{" "}
            {/* Hidden input to capture generated games */}
            {generatedGames.length === 0 && (
                <Group position="right" mt="lg">
                    <Button onClick={handleGenerateGamesClick} autoContrast>
                        Yes, generate games
                    </Button>
                    <Button
                        variant="outline"
                        color="gray"
                        onClick={() => {
                            handleCloseModal();
                            setError(null);
                        }}
                    >
                        Cancel
                    </Button>
                </Group>
            )}
            {generatedGames.length > 0 && (
                <>
                    <GamesTable games={generatedGames} />
                    <Divider size="sm" my="sm" />
                    <Text size="xs" px="xs">
                        *These game details are placeholders and can be adjusted
                        any time after creation.
                    </Text>
                </>
            )}
        </FormWrapper>
    );
}
