import { Input } from '@mantine/core';

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
    userId,
}) {

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText={confirmText}
        >
            <input type="hidden" name="userId" value={userId} />
            <AutocompleteEmail classes={classes.inputs} defaultValue={defaults.email} />
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