import { Form } from 'react-router';

import {
    Button,
    Group,
    MultiSelect,
    Select,
} from '@mantine/core';

import positions from '@/constants/positions';

import classes from '@/styles/inputs.module.css';

export default function PlayerDetailsForm({ setIsModalOpen, setError }) {

    return (
        <Form method="post">
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