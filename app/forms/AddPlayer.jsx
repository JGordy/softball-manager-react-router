import {
    Group,
    Input,
    MultiSelect,
    Radio,
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
    defaults = {},
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
                <Radio.Group
                    mb="md"
                    className={classes.inputs}
                    name="gender"
                    label="Gender"
                    required={action === 'add-player'}
                >
                    <Group mt="xs">
                        <Radio value="Male" label="Male" />
                        <Radio value="Female" label="Female" />
                    </Group>
                </Radio.Group>

            )}
            {shouldDisplay('throws-bats') && (
                <>
                    <Radio.Group
                        mb="md"
                        className={classes.inputs}
                        name="throws"
                        label="Throws"
                        description="Select which hand you throw with"
                        defaultValue={defaults.throws || 'right'}
                    >
                        <Group mt="xs">
                            <Radio value="left" label="Left" />
                            <Radio value="right" label="Right" />
                        </Group>
                    </Radio.Group>
                    <Radio.Group
                        mb="md"
                        className={classes.inputs}
                        name="bats"
                        label="Bats"
                        description="Select whether you bat left, right, or switch"
                        defaultValue={defaults.bats || 'right'}
                    >
                        <Group mt="xs">
                            <Radio value="left" label="Left" />
                            <Radio value="right" label="Right" />
                            <Radio value="switch" label="Switch" />
                        </Group>
                    </Radio.Group>
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