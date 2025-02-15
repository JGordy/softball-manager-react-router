import { Form } from 'react-router';

import {
    Button,
    Group,
    MultiSelect,
} from '@mantine/core';

import positions from '@/constants/positions';

import classes from '@/styles/inputs.module.css';

export default function PositionForm({ setIsModalOpen, setError }) {

    return (
        <Form method="post">
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