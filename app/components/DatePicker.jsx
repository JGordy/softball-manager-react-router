import { DatePickerInput } from "@mantine/dates";

import { IconCalendar } from '@tabler/icons-react';

import classes from '@/styles/inputs.module.css';

export default function DatePicker({ label, name }) {

    const iconProps = {
        color: 'currentColor',
        size: 18,
        stroke: 1.5
    };

    return (
        <DatePickerInput
            className={classes.inputs}
            leftSection={<IconCalendar {...iconProps} />}
            label={label}
            name={name}
            placeholder="Pick a date"
            firstDayOfWeek={0}
            highlightToday
            popoverProps={{ position: 'top' }}
        />
    );
}