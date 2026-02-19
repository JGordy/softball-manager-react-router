import { Group, NumberInput, Switch } from "@mantine/core";

import FormWrapper from "./FormWrapper";

import classes from "@/styles/inputs.module.css";

export default function AddGameResults({
    action = "update-game",
    actionRoute,
    buttonColor,
    confirmText = "Update Game Results",
    defaults = {},
    teamId,
}) {
    const numberInputProps = {
        className: classes.inputs,
        clampBehavior: "strict",
        labelProps: { mb: "xs" },
        size: "lg",
        min: 0,
        max: 100,
        step: 1,
    };

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText={confirmText}
        >
            <input type="hidden" name="teamId" value={teamId} />
            <Group mb="lg" justify="space-between" grow wrap="nowrap">
                <NumberInput
                    {...numberInputProps}
                    label="Our Score"
                    name="score"
                    defaultValue={defaults?.score}
                />
                <NumberInput
                    {...numberInputProps}
                    label="Opponent's Score"
                    name="opponentScore"
                    defaultValue={defaults?.opponentScore}
                />
            </Group>
            <Switch
                mb="xl"
                name="countTowardsRecord"
                label="Counts towards record"
                defaultChecked={
                    typeof defaults?.countTowardsRecord === "boolean"
                        ? defaults.countTowardsRecord
                        : true
                }
            />
        </FormWrapper>
    );
}
