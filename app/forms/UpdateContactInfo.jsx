import { PasswordInput } from "@mantine/core";

import AutocompleteEmail from "@/components/AutocompleteEmail";

import FormWrapper from "./FormWrapper";
import PhoneInput from "./components/PhoneInput";

import classes from "@/styles/inputs.module.css";

export default function UpdateContactInfo({
    action = "update-contact",
    actionRoute,
    buttonColor,
    confirmText = "Update Details",
    defaults = {},
    user,
}) {
    const userCopy = { ...user };
    delete userCopy.teams;

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText={confirmText}
        >
            <input type="hidden" name="user" value={JSON.stringify(userCopy)} />

            <AutocompleteEmail
                classes={classes.inputs}
                defaultValue={defaults.email}
            />

            <PhoneInput defaultValue={defaults.phoneNumber} />

            <PasswordInput
                className={classes.inputs}
                type="password"
                name="password"
                label="Password"
                placeholder="Your password"
                description="Required to update your contact information"
                mt="md"
                withAsterisk
            />
        </FormWrapper>
    );
}
