import { TextInput, Select } from '@mantine/core';

import FormWrapper from './FormWrapper';

import classes from '@/styles/inputs.module.css';

export default function AddGameResults({
    action = 'update-game',
    actionRoute,
    buttonColor,
    confirmText = 'Update Game Results',
    defaults = {},
    teamId,
}) {

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText={confirmText}
        >
            <input type="hidden" name="teamId" value={teamId} />
            <TextInput
                className={classes.inputs}
                label="Our Score"
                name="score"
                defaultValue={defaults.score}
            />
            <TextInput
                className={classes.inputs}
                label="Opponent's Score"
                name="opponentScore"
                defaultValue={defaults.opponentScore}
            />
            <Select
                className={classes.inputs}
                label="Our Result"
                name="result"
                data={['won', 'lost', 'tie']}
                defaultValue={defaults.result}
                mb="sm"
            />
        </FormWrapper>
    );
};