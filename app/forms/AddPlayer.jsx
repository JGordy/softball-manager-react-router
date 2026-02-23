import { useState } from "react";
import { Group, MultiSelect, Radio, TextInput } from "@mantine/core";

import AutocompleteEmail from "@/components/AutocompleteEmail";

import positions from "@/constants/positions";

import classes from "@/styles/inputs.module.css";

import FormWrapper from "./FormWrapper";
import PhoneInput from "./components/PhoneInput";

export default function AddPlayer({
    action = "add-player",
    actionRoute,
    buttonColor,
    confirmText = "Create Player",
    inputsToDisplay = [],
    defaults = {},
}) {
    const shouldDisplay = (field) => inputsToDisplay.includes(field);

    const allPositions = Object.keys(positions);

    const normalizePreferredPositions = (values) => {
        if (!Array.isArray(values)) {
            return [];
        }

        const uniqueValues = Array.from(new Set(values));

        return uniqueValues.filter((value) => allPositions.includes(value));
    };

    const normalizeDislikedPositions = (values, currentPreferred) => {
        if (!Array.isArray(values)) {
            return [];
        }

        const uniqueValues = Array.from(new Set(values));

        return uniqueValues.filter(
            (value) =>
                allPositions.includes(value) &&
                !currentPreferred.includes(value),
        );
    };

    const initialPreferred = normalizePreferredPositions(
        defaults.preferredPositions || [],
    );
    const initialDisliked = normalizeDislikedPositions(
        defaults.dislikedPositions || [],
        initialPreferred,
    );

    const [preferred, setPreferred] = useState(initialPreferred);
    const [disliked, setDisliked] = useState(initialDisliked);

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText={confirmText}
        >
            {shouldDisplay("name") && (
                <>
                    <TextInput
                        className={classes.inputs}
                        label="First Name"
                        name="firstName"
                        defaultValue={defaults.firstName || ""}
                        required={action === "add-player"}
                        radius="md"
                        size="md"
                    />
                    <TextInput
                        className={classes.inputs}
                        label="Last Name"
                        name="lastName"
                        defaultValue={defaults.lastName || ""}
                        required={action === "add-player"}
                        radius="md"
                        size="md"
                    />
                </>
            )}
            {shouldDisplay("contact") && (
                <>
                    <AutocompleteEmail
                        classes={classes.inputs}
                        defaultValue={defaults.email}
                        required={action === "add-player"}
                    />
                    <PhoneInput defaultValue={defaults.phoneNumber} />
                </>
            )}
            {shouldDisplay("gender") && (
                <Radio.Group
                    mb="md"
                    className={classes.inputs}
                    defaultValue={defaults.gender || "Male"}
                    name="gender"
                    label="Gender"
                    required={action === "add-player"}
                    size="md"
                >
                    <Group mt="xs">
                        <Radio value="Male" label="Male" />
                        <Radio value="Female" label="Female" />
                    </Group>
                </Radio.Group>
            )}
            {shouldDisplay("throws-bats") && (
                <>
                    <Radio.Group
                        mb="md"
                        className={classes.inputs}
                        name="throws"
                        label="Throws"
                        description="Select which hand you throw with"
                        defaultValue={defaults.throws || "Right"}
                        size="md"
                    >
                        <Group mt="xs">
                            <Radio value="Left" label="Left" />
                            <Radio value="Right" label="Right" />
                        </Group>
                    </Radio.Group>
                    <Radio.Group
                        mb="md"
                        className={classes.inputs}
                        name="bats"
                        label="Bats"
                        description="Select whether you bat left, right, or switch"
                        defaultValue={defaults.bats || "Right"}
                        size="md"
                    >
                        <Group mt="xs">
                            <Radio value="Left" label="Left" />
                            <Radio value="Right" label="Right" />
                            <Radio value="Switch" label="Switch" />
                        </Group>
                    </Radio.Group>
                </>
            )}

            {shouldDisplay("positions") && (
                <>
                    <MultiSelect
                        className={classes.inputs}
                        label="Preferred Positions"
                        name="preferredPositions"
                        description="What positions do you prefer?"
                        data={allPositions.filter((p) => !disliked.includes(p))}
                        value={preferred}
                        onChange={setPreferred}
                        mb="sm"
                        clearable
                        // searchable
                        hidePickedOptions
                        required={action === "add-player"}
                        radius="md"
                        size="md"
                    />
                    <MultiSelect
                        className={classes.inputs}
                        label="Disliked Positions"
                        name="dislikedPositions"
                        description="What positions are you NOT interested in?"
                        data={allPositions.filter(
                            (p) => !preferred.includes(p),
                        )}
                        value={disliked}
                        onChange={setDisliked}
                        mb="sm"
                        clearable
                        // searchable
                        hidePickedOptions
                        radius="md"
                        size="md"
                    />
                </>
            )}
            {shouldDisplay("song") && (
                <TextInput
                    className={classes.inputs}
                    defaultValue={defaults.walkUpSong}
                    label="Walk Up Song"
                    name="walkUpSong"
                    placeholder="Walk Up Song"
                    mb="sm"
                    radius="md"
                    size="md"
                />
            )}
        </FormWrapper>
    );
}
