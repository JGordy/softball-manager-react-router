import {
    MultiSelect,
    NumberInput,
    Select,
    TextInput,
} from '@mantine/core';

import { DatePickerInput } from '@mantine/dates';

// import { IconCalendar, IconCurrencyDollar } from '@tabler/icons-react';

import FormWrapper from './FormWrapper';

import classes from '@/styles/inputs.module.css';

export default function AddSeason({
    action = 'add-season',
    actionRoute,
    buttonColor,
    confirmText = 'Create Season',
    // setError,
    teamId,
}) {

    const iconProps = {
        color: 'currentColor',
        size: 18,
        stroke: 1.5
    };

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText={confirmText}
        >
            <input type="hidden" name="teamId" value={teamId} />
            <TextInput
                className={classes.inputs}
                label="Season Name"
                name="seasonName"
                placeholder='Fall Season 2025'
                required={action === 'add-season'}
            />
            <TextInput
                className={classes.inputs}
                label="Location"
                name="location"
                placeholder='Where will the games be played?'
            />
            <MultiSelect
                className={classes.inputs}
                label="Game Days"
                name="gameDays"
                placeholder="What day(s) are games played?"
                data={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']}
                mb="sm"
                clearable
                searchable
            />
            <Select
                className={classes.inputs}
                label="League Type"
                name="leagueType"
                placeholder="Select Gender"
                data={['Men', 'Women', 'Coed']}
                mb="sm"
                searchable
                required={action === 'add-season'}
            />
            <NumberInput
                className={classes.inputs}
                label="Sign Up Fee"
                name="signUpFee"
                clampBehavior="strict"
                // leftSection={<IconCurrencyDollar size={18} />}
                min={0}
                max={200}
                defaultValue={50}
                step={5}
            />
            <DatePickerInput
                className={classes.inputs}
                // leftSection={<IconCalendar {...iconProps} />}
                label="Season Start Date"
                name="startDate"
                placeholder="Pick a date"
                firstDayOfWeek={0}
            />
            <DatePickerInput
                className={classes.inputs}
                // leftSection={<IconCalendar {...iconProps} />}
                label="Season End Date"
                name="endDate"
                placeholder="Pick a date"
                firstDayOfWeek={0}
            />
        </FormWrapper>
    );
};