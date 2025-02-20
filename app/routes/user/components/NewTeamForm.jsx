import { Form } from 'react-router';

import {
    TextInput,
    Select,
    Group,
    ColorInput,
    NumberInput,
    Button,
} from '@mantine/core';

import {
    IconCurrencyDollar,
    IconMan,
    IconWoman,
    IconFriends,
} from '@tabler/icons-react';

import classes from '@/styles/inputs.module.css';

export default function TeamForm({ setIsModalOpen, setError }) {

    const iconProps = {
        color: 'currentColor',
        size: 18,
    };

    const genderIcons = {
        'Men': <IconMan {...iconProps} />,
        'Women': <IconWoman {...iconProps} />,
        'Coed': <IconFriends {...iconProps} />,
    };

    return (
        <div>
            <Form method="post">
                <TextInput
                    className={classes.inputs}
                    label="Team Name"
                    name="name"
                    placeholder='What do you call yourselves?'
                    required
                />
                <TextInput
                    className={classes.inputs}
                    label="League Name"
                    name="leagueName"
                    placeholder='Super rad weekend league'
                    required
                />
                <Select
                    className={classes.inputs}
                    label="Gender mix"
                    name="genderMix"
                    placeholder="Choose the league's gender composition"
                    data={['Men', 'Women', 'Coed']}
                    renderOption={({ option }) => (
                        <Group flex="1" gap="xs">
                            {genderIcons[option.value]}
                            {option.label}
                        </Group>
                    )}
                    required
                />
                <ColorInput
                    className={classes.inputs}
                    label="Primary Color"
                    placeholder="White"
                    name="primaryColor"
                />
                <NumberInput
                    className={classes.inputs}
                    label="Sign Up Fee"
                    name="signUpFee"
                    clampBehavior="strict"
                    leftSection={<IconCurrencyDollar size={18} />}
                    min={0}
                    max={200}
                    defaultValue={50}
                    step={5}
                />

                <Group position="right" mt="md">
                    <Button type="submit">Create Team</Button>
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
        </div>
    );
};