import { DatePickerInput } from "@mantine/dates";

import { IconCalendar } from "@tabler/icons-react";

import classes from "@/styles/inputs.module.css";

export default function DatePicker({
    defaultValue,
    error,
    label,
    name,
    onChange,
    placeholder = "Pick a date",
    required = false,
}) {
    const iconProps = {
        color: "currentColor",
        size: 18,
        stroke: 1.5,
    };

    return (
        <DatePickerInput
            size="md"
            className={classes.inputs}
            defaultValue={defaultValue}
            error={error}
            firstDayOfWeek={0}
            highlightToday
            leftSection={<IconCalendar {...iconProps} />}
            label={label}
            name={name}
            onChange={onChange}
            placeholder={placeholder}
            popoverProps={{ position: "top" }}
            required={required}
            radius="md"
        />
    );
}
