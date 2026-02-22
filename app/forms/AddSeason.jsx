import { MultiSelect, NumberInput, Select, TextInput } from "@mantine/core";

import { IconCurrencyDollar } from "@tabler/icons-react";

import DatePicker from "@/components/DatePicker";

import FormWrapper from "./FormWrapper";
import LocationInput from "./components/LocationInput";

import classes from "@/styles/inputs.module.css";

export default function AddSeason({
    action = "add-season",
    actionRoute,
    buttonColor,
    confirmText = "Create Season",
    teamId,
}) {
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
                placeholder="Fall Season 2025"
                required={action === "add-season"}
                radius="md"
                size="md"
            />
            <LocationInput classes={classes.inputs} />
            <MultiSelect
                className={classes.inputs}
                label="Game Days"
                name="gameDays"
                placeholder="What day(s) are games played?"
                data={[
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                ]}
                mb="sm"
                clearable
                // searchable
                radius="md"
                size="md"
            />
            <Select
                className={classes.inputs}
                label="League Type"
                name="leagueType"
                placeholder="Select Gender"
                data={["Men", "Women", "Coed"]}
                mb="sm"
                // searchable
                required={action === "add-season"}
                radius="md"
                size="md"
            />
            <NumberInput
                className={classes.inputs}
                label="Sign Up Fee"
                name="signUpFee"
                clampBehavior="strict"
                leftSection={<IconCurrencyDollar size={18} />}
                min={0}
                max={200}
                defaultValue={50}
                step={5}
                radius="md"
                size="md"
            />
            <DatePicker label="Season Start Date" name="startDate" />
            <DatePicker label="Season End Date" name="endDate" />
        </FormWrapper>
    );
}
