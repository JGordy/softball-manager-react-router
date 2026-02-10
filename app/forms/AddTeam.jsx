import { Group, Radio, TextInput, ColorInput } from "@mantine/core";

import classes from "@/styles/inputs.module.css";

import FormWrapper from "./FormWrapper";

export default function AddTeam({
    action = "add-team",
    actionRoute,
    buttonColor,
    userId,
    initialValues = {},
}) {
    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText={action === "edit-team" ? "Update Team" : "Create Team"}
        >
            {userId && <input type="hidden" name="userId" value={userId} />}

            <TextInput
                className={classes.inputs}
                defaultValue={initialValues.name}
                label="Team Name"
                name="name"
                placeholder="What do you call yourselves?"
                radius="md"
                size="md"
            />

            <TextInput
                className={classes.inputs}
                defaultValue={initialValues.displayName}
                label="Display Name"
                description="A shorter name for scoreboards and charts"
                name="displayName"
                placeholder="Short name or abbreviation"
                radius="md"
                size="md"
            />

            <TextInput
                className={classes.inputs}
                defaultValue={initialValues.leagueName}
                label="League Name"
                name="leagueName"
                placeholder="Super rad weekend league"
                radius="md"
                size="md"
            />

            <Radio.Group
                mb="md"
                className={classes.inputs}
                defaultValue={initialValues.genderMix || "Men"}
                name="genderMix"
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
                defaultValue={initialValues.primaryColor}
                label="Primary Color"
                placeholder="White"
                name="primaryColor"
                radius="md"
                size="md"
            />
        </FormWrapper>
    );
}
