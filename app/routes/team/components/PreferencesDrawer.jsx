import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { NumberInput, Button, Stack, Text } from "@mantine/core";
import DrawerContainer from "@/components/DrawerContainer";

export default function PreferencesDrawer({ opened, onClose, team }) {
    const fetcher = useFetcher();

    // Default to 0 (disabled) if not set
    const initialMaxMale = parseInt(team?.prefs?.maxMaleBatters, 10) || 0;
    const [maxMaleBatters, setMaxMaleBatters] = useState(initialMaxMale);

    const isSubmitting = fetcher.state === "submitting";

    useEffect(() => {
        setMaxMaleBatters(initialMaxMale);
    }, [initialMaxMale, opened]);

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
                        onChange={(val) => setMaxMaleBatters(val === "" ? 0 : val)}
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
