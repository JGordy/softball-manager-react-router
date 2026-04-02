import { Group, Radio, Stack, TextInput } from "@mantine/core";
import FormWrapper from "@/forms/FormWrapper";

export default function AddGuestPlayerModal({ teamId, eventId, actionRoute }) {
    return (
        <FormWrapper
            action="create-guest-player"
            actionRoute={actionRoute}
            confirmText="Add Guest Player"
        >
            <input type="hidden" name="teamId" value={teamId} />
            <input type="hidden" name="eventId" value={eventId} />

            <Stack gap="md">
                <TextInput
                    label="First Name"
                    name="firstName"
                    placeholder="e.g. John"
                    required
                    radius="md"
                    size="md"
                    autoFocus
                />
                <TextInput
                    label="Last Name"
                    name="lastName"
                    placeholder="e.g. Smith"
                    required
                    radius="md"
                    size="md"
                />
                <Radio.Group
                    label="Gender"
                    name="gender"
                    required
                    defaultValue="Male"
                    size="md"
                >
                    <Group mt="xs">
                        <Radio value="Male" label="Male" />
                        <Radio value="Female" label="Female" />
                    </Group>
                </Radio.Group>
            </Stack>
        </FormWrapper>
    );
}
