import { Input, PasswordInput, Text } from '@mantine/core';

import { IMaskInput } from 'react-imask';

import FormWrapper from './FormWrapper';

import AutocompleteEmail from '@/components/AutocompleteEmail';

import classes from '@/styles/inputs.module.css';

export default function UpdateContactInfo({
    action = 'update-contact',
    actionRoute,
    buttonColor,
    confirmText = 'Update Details',
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
            <AutocompleteEmail classes={classes.inputs} defaultValue={defaults.email} />
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
            <Input.Wrapper className={classes.inputs}>
                <Input.Label>Phone Number</Input.Label>
                <Input
                    defaultValue={defaults.phoneNumber}
                    component={IMaskInput}
                    label="Phone Number"
                    mask="(000) 000-0000"
                    name="phoneNumber"
                    placeholder='(xxx) xxx-xxxx'
                />
            </Input.Wrapper>
        </FormWrapper>
    );
};