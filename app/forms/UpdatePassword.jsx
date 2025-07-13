import { Button, PasswordInput, Text } from '@mantine/core';

import FormWrapper from './FormWrapper';

import classes from '@/styles/inputs.module.css';

export default function UpdatePassword({
    action = 'update-password',
    actionRoute,
    buttonColor = 'red',
    confirmText = 'Update Password',
    user = {},
}) {

    const isPasswordReset = action === 'password-reset';

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            hideButtons={isPasswordReset}
            confirmText={confirmText}
        >
            {isPasswordReset ? (
                <>
                    <Text c="red">
                        Do you want to continue?
                    </Text>
                    <Text mb="xl">
                        We&apos;ll send a link to reset your password to your associated email address.
                    </Text>
                    <input type="hidden" name="email" value={user.email} />

                    <Button
                        type="submit"
                        color={buttonColor}
                        autoContrast
                        fullWidth
                    >
                        {confirmText}
                    </Button>
                </>
            ) : (
                <>
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
                </>
            )}
        </FormWrapper>
    );
};
