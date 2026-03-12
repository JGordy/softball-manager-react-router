import { Group, SegmentedControl, Text } from "@mantine/core";

export default function TeamAvailabilityRow({
    team,
    value,
    onChange,
    disabled,
}) {
    return (
        <Group justify="space-between" wrap="nowrap">
            <Text size="sm" fw={500} truncate>
                {team.name}
            </Text>
            <SegmentedControl
                size="xs"
                data={[
                    { label: "None", value: "none" },
                    { label: "Attending", value: "accepted" },
                ]}
                value={value || "none"}
                onChange={onChange}
                disabled={disabled}
                radius="sm"
                color="blue"
            />
        </Group>
    );
}
