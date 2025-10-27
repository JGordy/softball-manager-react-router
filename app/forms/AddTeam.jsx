import { Group, Radio, TextInput, Select, ColorInput } from "@mantine/core";

import classes from "@/styles/inputs.module.css";

import FormWrapper from "./FormWrapper";

export default function AddTeam({
    action = "add-team",
    actionRoute,
    buttonColor,
    userId,
}) {
    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText="Create Team"
        >
            {userId && <input type="hidden" name="userId" value={userId} />}

            <TextInput
                className={classes.inputs}
                label="Team Name"
                name="name"
                placeholder="What do you call yourselves?"
                radius="md"
                size="md"
            />

            <TextInput
                className={classes.inputs}
                label="League Name"
                name="leagueName"
                placeholder="Super rad weekend league"
                radius="md"
                size="md"
            />

            <Radio.Group
                mb="md"
                className={classes.inputs}
                defaultValue="Men"
                name="gendermix"
                label="Gender mix"
                size="md"
            >
                <Group mt="xs">
                    <Radio value="Men" label="Men" />
                    <Radio value="Women" label="Women" />
                    <Radio value="Coed" label="Coed" />
                </Group>
            </Radio.Group>

            <ColorInput
                className={classes.inputs}
                label="Primary Color"
                placeholder="White"
                name="primaryColor"
                radius="md"
                size="md"
            />
        </FormWrapper>
    );
}
