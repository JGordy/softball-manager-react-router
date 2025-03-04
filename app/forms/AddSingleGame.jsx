import { useRef } from 'react';

import { ActionIcon, TextInput, Select } from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';

import { IconCalendar, IconClock } from '@tabler/icons-react';

import { getUserTimeZone } from '@/utils/dateTime';

import timeZones from '@/constants/timeZones';

import FormWrapper from './FormWrapper';

import classes from '@/styles/inputs.module.css';

export default function AddSingleGame({
    action = 'add-single-game',
    actionRoute,
    buttonColor,
    confirmText = 'Create Game',
    defaults = {},
    seasons,
    seasonId,
    teamId,
}) {

    const ref = useRef();

    const currentTimeZone = getUserTimeZone();

    const iconProps = {
        color: 'currentColor',
        size: 18,
        stroke: 1.5
    };

    const seasonOptions = seasons ? seasons.map(season => ({ label: season.seasonName, value: season.$id })) : null;

    const pickerControl = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref.current?.showPicker()}>
            <IconClock size={16} stroke={1.5} />
        </ActionIcon>
    );

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText={confirmText}
        >
            {seasonId && <input type="hidden" name="seasonId" value={seasonId} />}
            <input type="hidden" name="teamId" value={teamId} />
            <TextInput
                className={classes.inputs}
                label="Opponent's Name"
                name="opponent"
                placeholder="Who are we playing?"
                defaultValue={defaults.opponent}
            />
            <Select
                className={classes.inputs}
                label="Is home game?"
                name="isHomeGame"
                data={['true', 'false']}
                defaultValue={defaults.isHomegame || "true"}
                mb="sm"
                searchable
            />
            {(seasons?.length > 0) && (
                <Select
                    className={classes.inputs}
                    label="Which season are we adding to?"
                    name="seasonId"
                    data={seasonOptions}
                    mb="sm"
                    searchable
                />
            )}
            <DatePickerInput
                className={classes.inputs}
                leftSection={<IconCalendar {...iconProps} />}
                label="Game Date"
                name="gameDate"
                placeholder="When should this game be scheduled?"
                firstDayOfWeek={0}
                defaultValue={new Date(defaults.gameDate)}
                required={action === 'add-single-game'}
                highlightToday
            />
            <TimeInput
                label="Game Start Time"
                name="gameTime"
                placeholder="Set the start time of the game"
                ref={ref}
                rightSection={pickerControl}
                format="24"
                mb="sm"
                defaultValue={defaults.gameTime || "19:00"}
                required={action === 'add-single-game'}
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
        </FormWrapper>
    );
};