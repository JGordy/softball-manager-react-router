import { Form } from "react-router";

import { Button, Group, MultiSelect, NumberInput, Select, TextInput } from "@mantine/core";

import { IconCurrencyDollar } from "@tabler/icons-react";

import classes from "@/styles/inputs.module.css";

import DatePicker from "@/components/DatePicker";

export default function SeasonForm({
    handleCloseModal,
    setError,
    // primaryColor,
    // teamId,
}) {
    return (
        <Form method="post" type="submit" name="_action" value="edit-season">
            {/* <input type="hidden" name="teamId" value={teamId} /> */}
            <TextInput
                className={classes.inputs}
                label="Season Name"
                name="seasonName"
                placeholder="Fall Season 2025"
            />
            <TextInput
                className={classes.inputs}
                label="Location"
                name="location"
                placeholder="Where will the games be played?"
            />
            <MultiSelect
                className={classes.inputs}
                label="Game Days"
                name="gameDays"
                placeholder="What day(s) are games played?"
                data={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]}
                mb="sm"
                clearable
                searchable
            />
            <Select
                className={classes.inputs}
                label="League Type"
                name="leagueType"
                placeholder="Select Gender"
                data={["Men", "Women", "Coed"]}
                mb="sm"
                searchable
            />
            <NumberInput
                className={classes.inputs}
                label="Sign Up Fee"
                name="signUpFee"
                clampBehavior="strict"
                leftSection={<IconCurrencyDollar size={18} />}
                min={0}
                max={200}
                step={5}
            />

            <DatePicker label="Season Start Date" name="startDate" />

            <DatePicker label="Season End Date" name="endDate" />

            <Group position="right" mt="lg">
                <Button
                    type="submit"
                    // color={primaryColor}
                    name="_action"
                    value="edit-season"
                    autoContrast
                >
                    Submit
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
}
