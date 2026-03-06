import { Group, SegmentedControl, Text } from "@mantine/core";

export function RunnerControl({
    label,
    value,
    onChange,
    intermediateOptions = [],
    hideStay = false,
}) {
    if (value === null || value === undefined) return null;

    const data = [
        ...(!hideStay ? [{ label: "Stay", value: "stay" }] : []),
        ...intermediateOptions,
        { label: "Score", value: "score" },
        { label: "OUT", value: "out" },
    ];

    return (
        <Group gap="xs" justify="space-between" wrap="nowrap">
            <Text size="xs" fw={700} style={{ flexShrink: 0 }}>
                {label}:
            </Text>
            <SegmentedControl
                size="xs"
                color="blue"
                value={value}
                onChange={onChange}
                data={data}
                transitionDuration={200}
                style={{ flex: 1, maxWidth: 300 }}
            />
        </Group>
    );
}

export default RunnerControl;
