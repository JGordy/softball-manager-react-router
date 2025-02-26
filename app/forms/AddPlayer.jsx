import {
    Input,
    MultiSelect,
    Select,
    TextInput,
} from '@mantine/core';

import { IMaskInput } from 'react-imask';

import AutocompleteEmail from '@/components/AutoCompleteEmail';

import positions from '@/constants/positions';

import classes from '@/styles/inputs.module.css';

import FormWrapper from './FormWrapper';

export default function AddPlayer({
    action = 'add-player',
    actionRoute,
    buttonColor,
}) {

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText="Create Player"
        >
            <TextInput
                className={classes.inputs}
                label="First Name"
                name="firstName"
                required
            />
            <TextInput
                className={classes.inputs}
                label="Last Name"
                name="lastName"
                required
            />
            <AutocompleteEmail classes={classes.inputs} required />
            <Input.Wrapper className={classes.inputs}>
                <Input.Label>Phone Number</Input.Label>
                <Input
                    component={IMaskInput}
                    label="Phone Number"
                    mask="(000) 000-0000"
                    name="phoneNumber"
                    placeholder='(xxx) xxx-xxxx'
                />
            </Input.Wrapper>
            <Select
                className={classes.inputs}
                label="Gender"
                name="gender"
                placeholder="Select Gender"
                data={['Male', 'Female']}
                mb="sm"
                required
            />
            <MultiSelect
                className={classes.inputs}
                label="Preferred Positions"
                name="preferredPositions"
                placeholder="Select Positions"
                data={Object.keys(positions)}
                mb="sm"
                clearable
                searchable
                required
            />
            <MultiSelect
                className={classes.inputs}
                label="Disliked Positions"
                name="dislikedPositions"
                placeholder="What positions are you NOT interested in?"
                data={Object.keys(positions)}
                mb="sm"
                clearable
                searchable
            />
            <TextInput
                className={classes.inputs}
                label="Walk Up Song"
                name="walkUpSong"
                placeholder="Walk Up Song"
                mb="sm"
            />
        </FormWrapper>
    );
};