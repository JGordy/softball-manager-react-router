import { useRef } from "react";

import { ActionIcon, Group, Radio, TextInput, Select } from "@mantine/core";
import { TimeInput } from "@mantine/dates";

import { IconClock } from "@tabler/icons-react";

import { getUserTimeZone } from "@/utils/dateTime";
import { DateTime } from "luxon";

import timeZones from "@/constants/timeZones";

import DatePicker from "@/components/DatePicker";

import FormWrapper from "./FormWrapper";
import LocationInput from "./components/LocationInput";

import classes from "@/styles/inputs.module.css";

export default function AddSingleGame({
    action = "add-single-game",
    actionRoute,
    buttonColor,
    confirmText = "Create Game",
    defaults = {},
    locationPlaceholder,
    seasons,
    seasonId,
    teamId,
}) {
    const ref = useRef();

    const currentTimeZone = getUserTimeZone();

    const seasonOptions = seasons
        ? seasons.map((season) => ({
              label: season.seasonName,
              value: season.$id,
          }))
        : null;

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
            buttonColor={buttonColor}
            confirmText={confirmText}
        >
            {seasonId && (
                <input type="hidden" name="seasonId" value={seasonId} />
            )}
            <input type="hidden" name="teamId" value={teamId} />
            <TextInput
                className={classes.inputs}
                label="Opponent's Name"
                name="opponent"
                placeholder="Who are we playing?"
                defaultValue={defaults.opponent}
                radius="md"
                size="md"
            />
            <Radio.Group
                mb="md"
                size="md"
                className={classes.inputs}
                defaultValue={`${defaults?.isHomeGame}`}
                name="isHomeGame"
                label="Select the game location"
                description="Select whether this game is at home or away"
            >
                <Group mt="xs">
                    <Radio color="red" value="false" label="Away" />
                    <Radio color="green" value="true" label="Home" />
                </Group>
            </Radio.Group>
            <LocationInput
                defaultValue={defaults.location || ""}
                placeholder={locationPlaceholder}
            />
            <TextInput
                className={classes.inputs}
                label="Location Notes"
                name="locationNotes"
                placeholder="Field #1, North Park, etc."
                defaultValue={defaults.locationNotes || ""}
                radius="md"
                size="md"
            />
            {seasons?.length > 0 && (
                <Select
                    className={classes.inputs}
                    label="Which season are we adding to?"
                    name="seasonId"
                    data={seasonOptions}
                    mb="sm"
                    // searchable
                    radius="md"
                    size="md"
                />
            )}
            <DatePicker
                label="Game Date"
                name="gameDate"
                placeholder="When should this game be scheduled?"
                defaultValue={
                    defaults.gameDate &&
                    DateTime.fromISO(defaults.gameDate, {
                        zone: "utc",
                    }).toJSDate()
                }
                required={action === "add-single-game"}
                radius="md"
                size="md"
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
                required={action === "add-single-game"}
                radius="md"
                size="md"
            />
            <Select
                className={classes.inputs}
                label="Time Zone"
                name="timeZone"
                description="Select time zone if game is not in your current time zone (Uncommon)"
                data={timeZones}
                defaultValue={currentTimeZone}
                mb="sm"
                // searchable
                radius="md"
                size="md"
            />
        </FormWrapper>
    );
}
