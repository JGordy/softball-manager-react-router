import { useRef } from 'react';
import { Form } from 'react-router';

import {
    ActionIcon,
    Button,
    Group,
    Select,
    TextInput,
} from '@mantine/core';

import { DatePickerInput, TimeInput } from '@mantine/dates';

import { IconCalendar, IconClock } from '@tabler/icons-react';

import { getUserTimeZone } from '@/utils/dateTime';

import timeZones from '@/constants/timeZones';

import classes from '@/styles/inputs.module.css';

export default function SingleGameForm({ handleCloseModal, setError, primaryColor, season }) {

    const ref = useRef(null);

    const currentTimeZone = getUserTimeZone();

    const iconProps = {
        color: 'currentColor',
        size: 18,
        stroke: 1.5
    };

    const pickerControl = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref.current?.showPicker()}>
            <IconClock size={16} stroke={1.5} />
        </ActionIcon>
    );

    return (
        <Form method="post">
            <input type="hidden" name="seasonId" value={season.$id} />
            <input type="hidden" name="teamId" value={season.teamId} />
            <TextInput
                className={classes.inputs}
                label="Opponent's Name"
                name="opponent"
                placeholder="Who are we playing?"
            />
            <Select
                className={classes.inputs}
                label="Is home game?"
                name="isHomeGame"
                data={['true', 'false']}
                defaultValue="true"
                mb="sm"
                searchable
            />
            <DatePickerInput
                className={classes.inputs}
                leftSection={<IconCalendar {...iconProps} />}
                label="Game Date"
                name="gameDate"
                placeholder="When should this game be scheduled?"
                firstDayOfWeek={0}
                required
            />
            <TimeInput
                label="Game Start Time"
                name="gameTime"
                placeholder="Set the start time of the game"
                ref={ref}
                rightSection={pickerControl}
                format="24"
                mb="sm"
                defaultValue="19:00"
                required
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

            <Group position="right" mt="lg">
                <Button
                    type="submit"
                    color={primaryColor}
                    name="_action"
                    value="add-single-game"
                    autoContrast
                >
                    Create game
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
        </Form>
    );
};