import { DatePickerInput } from "@mantine/dates";

import { IconCalendar } from '@tabler/icons-react';

import classes from '@/styles/inputs.module.css';

export default function DatePicker({
    defaultValue,
    label,
    name,
    placeholder = 'Pick a date',
    required = false,
}) {

    const iconProps = {
        color: 'currentColor',
        size: 18,
        stroke: 1.5
    };

    return (
        <DatePickerInput
            className={classes.inputs}
            defaultValue={defaultValue}
            firstDayOfWeek={0}
            highlightToday
            leftSection={<IconCalendar {...iconProps} />}
            label={label}
            name={name}
            placeholder={placeholder}
            popoverProps={{ position: 'top' }}
            required={required}
        />
    );
}