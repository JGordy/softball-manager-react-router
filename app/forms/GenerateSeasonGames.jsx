import { useState, useRef } from 'react';

import {
    ActionIcon,
    Button,
    Divider,
    Group,
    Highlight,
    LoadingOverlay,
    Select,
    Text,
} from '@mantine/core';

import { TimeInput } from '@mantine/dates';
// import { IconClock } from '@tabler/icons-react';

import GamesTable from '@/components/GamesTable';

import timeZones from '@/constants/timeZones';

import { getUserTimeZone } from '@/utils/dateTime';

import FormWrapper from './FormWrapper';

import classes from '@/styles/inputs.module.css';

export default function GenerateSeasonGames({
    action = 'add-games',
    actionRoute,
    season,
}) {

    const ref = useRef(null);

    const currentTimeZone = getUserTimeZone();

    const [gameTimes, setGameTimes] = useState(() => {
        const now = new Date();
        const sevenPM = new Date(now);
        sevenPM.setHours(19, 0, 0, 0); // Set to 7 PM as default
        return sevenPM;
    });

    const [isLoading, setIsLoading] = useState(false);

    // Used for games generated but not yet saved/confirmed
    const [generatedGames, setGeneratedGames] = useState([]);

    const seasonStartDate = new Date(season.startDate).toLocaleDateString();
    const seasonEndDate = new Date(season.endDate).toLocaleDateString();

    const handleGenerateGamesClick = () => {
        setIsLoading(true);

        const getDayName = (dayOfWeek) => {
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            return days[dayOfWeek];
        };

        // generate games 
        const { gameDays, startDate, endDate, teamId } = season;

        const start = new Date(startDate);
        const end = new Date(endDate);

        const games = [];

        for (const gameDay of gameDays) {
            let currentDate = new Date(start);

            // Parse the time string (gameTimes)
            const timeString = gameTimes.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            const [hours, minutes] = timeString.split(':');
            currentDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

            while (currentDate <= end) {
                if (getDayName(currentDate.getDay()) === gameDay) {
                    games.push({
                        gameDate: currentDate.toISOString(),
                        teamId,
                        seasonId: season.$id,
                        seasons: season.$id,
                    });
                }
                currentDate.setDate(currentDate.getDate() + 1); // Increment by one day
            }
        }

        setTimeout(() => setGeneratedGames(games), 300);
        setTimeout(() => setIsLoading(false), 500);
    };

    const handleResetGames = () => {
        setGeneratedGames([]);
    };

    const handleSetGameTimesChange = (event) => {
        const { value: timeString } = event.target;
        if (timeString) {
            const [hours, minutes] = timeString.split(':');
            const now = new Date();
            const selectedTime = new Date(now);
            selectedTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            setGameTimes(selectedTime); // Store the Date object

            // Update generated games with the new time
            if (generatedGames.length > 0) {
                setGeneratedGames((prevGames) => {
                    return prevGames.map((game) => {
                        const gameDate = new Date(game.gameDate);
                        gameDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
                        return {
                            ...game,
                            gameDate: gameDate.toISOString(), // Update gameDate with new time
                        };
                    });
                });
            };
        } else {
            setGameTimes(null); // Handle clearing the time
        }
    };

    const pickerControl = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref.current?.showPicker()}>
            {/* <IconClock size={16} stroke={1.5} /> */}
        </ActionIcon>
    );

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            pos="relative"
            hideButtons={!generatedGames.length}
            confirmText='Save Games'
            cancelText='Clear Games'
            onCancelClick={handleResetGames}
        >
            <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 3, }} />
            <Highlight
                highlight={[`${season.gameDays}`, `${seasonStartDate}`, `${seasonEndDate}`, `${gameTimes?.toLocaleTimeString()}`]}
                highlightStyles={{
                    // backgroundColor: 'green',
                    backgroundImage: 'linear-gradient(45deg, var(--mantine-color-cyan-5), var(--mantine-color-green-6))',
                    fontWeight: 700,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}
            >
                {`Create placeholder games for every ${season.gameDays} between ${seasonStartDate} and ${seasonEndDate} @ ${gameTimes?.toLocaleTimeString()}?`}
            </Highlight>

            <Divider size="sm" my="sm" />

            <TimeInput
                label="Game Times"
                placeholder='Select a default start time for your games '
                ref={ref}
                rightSection={pickerControl}
                onChange={handleSetGameTimesChange}
                format="24"
                mb="sm"
                defaultValue="19:00"
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
            />

            <input type="hidden" name="games" value={JSON.stringify(generatedGames)} /> {/* Hidden input to capture generated games */}

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
                    <Text size="xs" px="xs">*These game details are placeholders and can be adjusted any time after creation.</Text>
                </>
            )}
        </FormWrapper>
    );
};