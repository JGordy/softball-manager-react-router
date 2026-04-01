import { useEffect, useRef } from "react";
import { useActionData } from "react-router";
import { Stack, TextInput, Radio, Group } from "@mantine/core";
import FormWrapper from "./FormWrapper";
import useModal from "@/hooks/useModal";
import classes from "@/styles/inputs.module.css";

export default function AddGuestPlayer({
    action = "create-guest-player",
    actionRoute,
    buttonColor,
    teamId,
    eventId,
    guestId,
    defaults = {},
    onSubmit,
}) {
    const actionData = useActionData();
    const { closeAllModals } = useModal();
    // Capture the action data from the route when this modal is first opened
    const initialActionData = useRef(actionData);

    useEffect(() => {
        // Only close if we have a NEW successful submission (actionData changed from initial)
        if (
            actionData?.success &&
            actionData !== initialActionData.current &&
            actionData?.response?.player
        ) {
            if (onSubmit) {
                onSubmit();
            }
            closeAllModals();
        }
    }, [actionData, closeAllModals, onSubmit]);

    const isEdit = action === "update-guest-player";

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText={isEdit ? "Update Guest" : "Create & Add to Lineup"}
        >
            <input type="hidden" name="teamId" value={teamId} />
            <input type="hidden" name="eventId" value={eventId} />
            {guestId && <input type="hidden" name="userId" value={guestId} />}

            <Stack gap="md">
                <TextInput
                    className={classes.inputs}
                    label="First Name"
                    name="firstName"
                    placeholder="Enter first name"
                    defaultValue={defaults.firstName}
                    required
                    radius="md"
                    size="md"
                    autoFocus
                />
                <TextInput
                    className={classes.inputs}
                    label="Last Name"
                    name="lastName"
                    placeholder="Enter last name"
                    defaultValue={defaults.lastName}
                    required
                    radius="md"
                    size="md"
                />
                <Radio.Group
                    className={classes.inputs}
                    label="Gender"
                    name="gender"
                    required
                    defaultValue={defaults.gender || "Male"}
                    size="md"
                >
                    <Group mt="xs">
                        <Radio value="Male" label="Male" />
                        <Radio value="Female" label="Female" />
                    </Group>
                </Radio.Group>
            </Stack>
        </FormWrapper>
    );
}
