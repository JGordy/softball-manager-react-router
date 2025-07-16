import { useEffect, useState } from 'react';
import { useSearchParams, redirect } from 'react-router';

import {
    Alert,
    Button,
    Paper,
    PasswordInput,
    Text,
    Title,
} from '@mantine/core';

import { IconRosetteDiscountCheckFilled, IconExclamationCircleFilled } from '@tabler/icons-react';

import FormWrapper from '@/forms/FormWrapper';

import { account } from '@/appwrite';

import classes from '@/styles/inputs.module.css';

export async function clientAction({ request }) {
    const formData = await request.formData();
    const userId = formData.get("userId");
    const secret = formData.get("secret");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    console.log({ userId, secret, newPassword, confirmPassword });

    if (newPassword !== confirmPassword) {
        return { success: false, message: "Passwords do not match" };
    }

    try {
        const response = await account.updateRecovery(userId, secret, newPassword);
        console.log({ response });

        return {
            success: true,
            message: "Password updated successfully",
        };

    } catch (error) {
        return {
            message: error?.message || "Error: Could not update password.",
            success: false
        };
    }
}

export default function Verify({ actionData }) {
    const [searchParams] = useSearchParams();

    const [params] = useState({
        secret: searchParams.get('secret'),
        userId: searchParams.get('userId'),
    });
    const { secret, userId } = params;

    useEffect(() => {
        if (actionData?.success) {

            setTimeout(() => {
                // Redirect to the home page?
                redirect('/');
            }, 2500);
        }

        if (!actionData?.success) {
            // Do something
        }
    }, [actionData]);

    return (
        <Paper p="xl">
            <Title order={2} mb="lg">Create a new password</Title>
            {(secret && userId) ? (
                <>
                    {actionData?.message && (
                        <Alert
                            variant="light"
                            color={actionData.success ? 'green' : 'red'}
                            icon={actionData.success ? <IconRosetteDiscountCheckFilled size={16} /> : <IconExclamationCircleFilled size={16} />}
                        >
                            {actionData.message}
                        </Alert>
                    )}
                    <Text my="lg" c="dimmed">Your new password must be different from your previous used passwords.</Text>
                    <FormWrapper
                        action="reset-password"
                        actionRoute="/recovery"
                        confirmText="Submit new password"
                        hideButtons
                    >
                        {secret && <input type="hidden" name="secret" value={secret} />}
                        {userId && <input type="hidden" name="userId" value={userId} />}
                        <PasswordInput
                            className={classes.inputs}
                            type="password"
                            name="newPassword"
                            label="New Password"
                            description="Must be at least 8 characters long"
                            mt="md"
                            withAsterisk
                        />
                        <PasswordInput
                            className={classes.inputs}
                            type="password"
                            name="confirmPassword"
                            label="Confirm Password"
                            description="Both passwords must match"
                            mt="md"
                            withAsterisk
                        />
                        <Button
                            mt="xl"
                            type="submit"
                            color="green"
                            autoContrast
                            fullWidth
                        >
                            Reset Password
                        </Button>
                    </FormWrapper>
                </>
            ) : (
                <Text mt="xl">You have reached an invalid password reset link.</Text>
            )}
        </Paper>
    );
};