import {
    Input,
    MultiSelect,
    Select,
    TextInput,
} from '@mantine/core';

import { IMaskInput } from 'react-imask';

import AutocompleteEmail from '@/components/AutocompleteEmail';

import positions from '@/constants/positions';

import classes from '@/styles/inputs.module.css';

import FormWrapper from './FormWrapper';

export default function AddPlayer({
    action = 'add-player',
    actionRoute,
    buttonColor,
    confirmText = 'Create Player',
    inputsToDisplay = [],
}) {

    const shouldDisplay = (field) => inputsToDisplay.includes(field);

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText={confirmText}
        >
            {shouldDisplay('name') && (
                <>
                    <TextInput
                        className={classes.inputs}
                        label="First Name"
                        name="firstName"
                        required={action === 'add-player'}
                    />
                    <TextInput
                        className={classes.inputs}
                        label="Last Name"
                        name="lastName"
                        required={action === 'add-player'}
                    />
                </>
            )}
            {shouldDisplay('contact') && (
                <>
                    <AutocompleteEmail classes={classes.inputs} required={action === 'add-player'} />
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
                </>
            )}
            {shouldDisplay('gender') && (
                <Select
                    className={classes.inputs}
                    label="Gender"
                    name="gender"
                    placeholder="Select Gender"
                    data={['Male', 'Female']}
                    mb="sm"
                    required={action === 'add-player'}
                />
            )}
            {shouldDisplay('throws-bats') && (
                <>
                    <Select
                        className={classes.inputs}
                        label="Throws"
                        name="throws"
                        placeholder="Which hand do you throw with?"
                        data={['Right', 'Left']}
                        mb="sm"
                    />
                    <Select
                        className={classes.inputs}
                        label="Bats"
                        name="bats"
                        placeholder="On what side of the plate do you bat?"
                        data={['Right', 'Left', 'Switch']}
                        mb="sm"
                    />
                </>
            )}

            {shouldDisplay('positions') && (
                <>
                    <MultiSelect
                        className={classes.inputs}
                        label="Preferred Positions"
                        name="preferredPositions"
                        placeholder="What positions do you prefer?"
                        data={Object.keys(positions)}
                        mb="sm"
                        clearable
                        searchable
                        required={action === 'add-player'}
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
                </>
            )}
            {shouldDisplay('song') && (
                <TextInput
                    className={classes.inputs}
                    label="Walk Up Song"
                    name="walkUpSong"
                    placeholder="Walk Up Song"
                    mb="sm"
                />
            )}
        </FormWrapper>
    );
};