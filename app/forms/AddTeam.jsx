import {
    TextInput,
    Select,
    ColorInput,
} from '@mantine/core';

import classes from '@/styles/inputs.module.css';

import FormWrapper from './FormWrapper';

export default function TeamDetailsForm({
    action = 'add-team',
    actionRoute,
    buttonColor,
}) {

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText="Create Team"
        >
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
        </FormWrapper>
    );
};