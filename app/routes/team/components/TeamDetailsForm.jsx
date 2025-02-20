import { Form } from 'react-router';

import {
    TextInput,
    Select,
    Group,
    ColorInput,
    Button,
} from '@mantine/core';

import classes from '@/styles/inputs.module.css';

export default function TeamDetailsForm({ handleCloseModal, setError, primaryColor, teamId }) {

    return (
        <div>
            <Form method="post">
                <TextInput
                    className={classes.inputs}
                    label="Team Name"
                    name="name"
                    placeholder='What do you call yourselves?'
                />

                <TextInput
                    className={classes.inputs}
                    label="League Name"
                    name="leagueName"
                    placeholder='Super rad weekend league'
                />

                <Select
                    className={classes.inputs}
                    label="Gender mix"
                    name="genderMix"
                    placeholder="Choose the league's gender composition"
                    data={['Men', 'Women', 'Coed']}
                    searchable
                />

                <ColorInput
                    className={classes.inputs}
                    label="Primary Color"
                    placeholder="White"
                    name="primaryColor"
                />

                <Group position="right" mt="md">
                    <Button
                        type="submit"
                        name="_action"
                        value="edit-team"
                        color={primaryColor}
                        autoContrast
                    >
                        Update Team
                    </Button>
                    <Button
                        variant="outline"
                        color="gray"
                        onClick={() => {
                            handleCloseModal(true);
                            setError(null);
                        }}
                    >
                        Cancel
                    </Button>
                </Group>
            </Form>
        </div>
    );
};