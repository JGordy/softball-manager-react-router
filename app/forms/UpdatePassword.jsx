import { PasswordInput } from '@mantine/core';

import FormWrapper from './FormWrapper';

import classes from '@/styles/inputs.module.css';

export default function UpdatePassword({
    action = 'update-password',
    actionRoute,
    confirmText = 'Update Password',
}) {

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            buttonColor="green"
            confirmText={confirmText}
        >
            <PasswordInput
                className={classes.inputs}
                type="password"
                name="currentPassword"
                label="Current Password"
                placeholder="Your password"
                description="Used to verify your identity"
                mt="md"
                withAsterisk
            />
            <PasswordInput
                className={classes.inputs}
                type="password"
                name="newPassword"
                label="New Password"
                placeholder="Your new password"
                description="Must be at least 8 characters long"
                mt="md"
                withAsterisk
            />
        </FormWrapper>
    );
};
