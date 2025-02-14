import { Form } from 'react-router';

import {
    Button,
    Group,
    Input,
    MultiSelect,
    Select,
    TextInput,
} from '@mantine/core';

import { IMaskInput } from 'react-imask';

import AutocompleteEmail from '@/components/AutoCompleteEmail';

import positions from '@/constants/positions';

import classes from '@/styles/inputs.module.css';

export default function UpdateUserForm({ user, setIsModalOpen, setError }) {

    return (
        <Form method="post">
            <TextInput
                className={classes.inputs}
                label="First Name"
                name="firstName"
            />
            <TextInput
                className={classes.inputs}
                label="Last Name"
                name="lastName"
            />
            <AutocompleteEmail classes={classes.inputs} />
            <Input.Wrapper className={classes.inputs}>
                <Input.Label>Phone Number</Input.Label>
                <Input
                    component={IMaskInput}
                    defaultValue={user.phoneNumber}
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
            />
            <MultiSelect
                className={classes.inputs}
                label="Preferred Positions"
                name="preferredPositions"
                placeholder="What positions are you interested in?"
                data={positions}
                mb="sm"
                clearable
                searchable
            />
            <MultiSelect
                className={classes.inputs}
                label="Disliked Positions"
                name="dislikedPositions"
                placeholder="What positions are you NOT interested in?"
                data={positions}
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

            <Group position="right" mt="lg">
                <Button type="submit">
                    Submit
                </Button>
                <Button
                    variant="outline"
                    color="gray"
                    onClick={() => {
                        setIsModalOpen(false);
                        setError(null);
                    }}
                >
                    Cancel
                </Button>
            </Group>
        </Form>
    );
};