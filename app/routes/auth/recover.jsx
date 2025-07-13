import { useEffect } from 'react';
import { useSearchParams } from 'react-router';

import { Button, PasswordInput, Text } from '@mantine/core';

import FormWrapper from '@/components/FormWrapper';

// import { account } from '@/appwrite';

import classes from '@/styles/inputs.module.css';

export async function clientAction({ request }) {
    const formData = await request.formData();
    const userId = formData.get("userId");
    const secret = formData.get("secret");
    const password = formData.get("password");

    console.log({ userId, secret, password });

    // const result = await account.updateRecovery(
    //     userId, // userId
    //     secret, // secret
    //     password, // new password
    // );

    // const response = await login({ email, password });

    // if (response?.error) {
    //     return { error: response.error?.message || response.error };
    // }

    // return { email, password, session: response.session };
}

export default function Verify({ actionData }) {
    const [searchParams] = useSearchParams();

    const secret = searchParams.get('secret');
    const userId = searchParams.get('userId');

    useEffect(() => {
        if (actionData?.success) {
            // Do something
        }

        if (actionData?.status === 500) {
            // Do something
        }
    }, [actionData]);

    return (
        <div className="password-recovery-container">
            <h1>Password Reset</h1>
            <Text>Please submit a new password.</Text>
            <FormWrapper
                action="reset-password"
                actionRoute="/recovery"
                hideButtons
            >
                <input type="hidden" name="secret" value={secret} />
                <input type="hidden" name="userId" value={userId} />
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
                <Button
                    type="submit"
                    color="green"
                    autoContrast
                    fullWidth
                >
                    {confirmText}
                </Button>
            </FormWrapper>
        </div>
    );
};