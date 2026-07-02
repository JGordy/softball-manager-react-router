import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import {
    NumberInput,
    Button,
    Stack,
    Text,
    Select,
    Group,
    Card,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import DrawerContainer from "@/components/DrawerContainer";

export default function PreferencesDrawer({ opened, onClose, team }) {
    const fetcher = useFetcher();

    // Default to 0 (disabled) if not set
    const initialMaxMale = parseInt(team?.prefs?.maxMaleBatters, 10) || 0;
    const [maxMaleBatters, setMaxMaleBatters] = useState(initialMaxMale);

    const initialStrategy = team?.prefs?.lineupStrategy || "spread";
    const [lineupStrategy, setLineupStrategy] = useState(initialStrategy);

    const isSubmitting = fetcher.state === "submitting";

    useEffect(() => {
        setMaxMaleBatters(initialMaxMale);
        setLineupStrategy(initialStrategy);
    }, [initialMaxMale, initialStrategy, opened]);

    useEffect(() => {
        if (fetcher.data?.success) {
            onClose();
        }
    }, [fetcher.data, onClose]);

    const handleSubmit = (e) => {
        e.preventDefault();
        fetcher.submit(
            {
                _action: "update-preferences",
                maxMaleBatters: maxMaleBatters,
                lineupStrategy: lineupStrategy,
            },
            { method: "post", action: `/team/${team.$id}` },
        );
    };

    return (
        <DrawerContainer
            opened={opened}
            onClose={onClose}
            title="Team Preferences"
        >
            <fetcher.Form onSubmit={handleSubmit}>
                <Stack>
                    <Text size="sm" c="dimmed">
                        Configure specific rules for this team's league.
                    </Text>

                    <NumberInput
                        label="Max Consecutive Male Batters"
                        description="Set to 0 to disable this rule."
                        min={0}
                        max={10}
                        value={maxMaleBatters}
                        onChange={(val) =>
                            setMaxMaleBatters(val === "" ? 0 : val)
                        }
                    />

                    <Select
                        label="Lineup Strategy"
                        description="How should the lineup be ordered?"
                        data={[
                            {
                                value: "spread",
                                label: "Spread",
                                description:
                                    "Optimized for minimal outs by spacing out your best hitters.",
                            },
                            {
                                value: "best_first",
                                label: "Grouped at Top",
                                description:
                                    "Get more at-bats for your best hitters by putting them first.",
                            },
                        ]}
                        value={lineupStrategy}
                        onChange={setLineupStrategy}
                        comboboxProps={{ zIndex: 10000 }}
                        renderOption={({ option, checked }) => (
                            <Card
                                withBorder
                                padding="sm"
                                radius="md"
                                style={{
                                    pointerEvents: "none",
                                    borderLeft: checked
                                        ? "4px solid var(--mantine-primary-color-filled)"
                                        : undefined,
                                }}
                            >
                                <Group wrap="nowrap" justify="space-between">
                                    <Stack gap={0}>
                                        <Text size="sm" fw={500}>
                                            {option.label}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {option.description}
                                        </Text>
                                    </Stack>
                                    {checked && (
                                        <IconCheck
                                            size={20}
                                            color="var(--mantine-primary-color-filled)"
                                            stroke={2.5}
                                        />
                                    )}
                                </Group>
                            </Card>
                        )}
                    />

                    <Button
                        type="submit"
                        loading={isSubmitting}
                        fullWidth
                        mt="md"
                    >
                        Save Preferences
                    </Button>
                </Stack>
            </fetcher.Form>
        </DrawerContainer>
    );
}
