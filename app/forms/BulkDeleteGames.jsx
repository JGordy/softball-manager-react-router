import { useState } from "react";
import { Checkbox, Text, Stack, ScrollArea, Group } from "@mantine/core";
import { DateTime } from "luxon";

import FormWrapper from "./FormWrapper";

export default function BulkDeleteGames({
    action = "delete-games",
    actionRoute,
    buttonColor,
    season,
    onCancel,
}) {
    const defaultGames = season?.games || [];
    // Sort games by date ascending
    const sortedGames = [...defaultGames].sort((a, b) => {
        const dateA = DateTime.fromISO(a.gameDate).toMillis();
        const dateB = DateTime.fromISO(b.gameDate).toMillis();
        return dateA - dateB;
    });

    const [selectedGameIds, setSelectedGameIds] = useState([]);

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedGameIds(sortedGames.map((g) => g.$id));
        } else {
            setSelectedGameIds([]);
        }
    };

    return (
        <FormWrapper
            action={action}
            actionRoute={actionRoute}
            buttonColor={buttonColor}
            confirmText={
                selectedGameIds.length > 0
                    ? `Delete ${selectedGameIds.length} Game${selectedGameIds.length === 1 ? "" : "s"}`
                    : "Delete Games"
            }
            confirmDisabled={selectedGameIds.length === 0}
            onCancelClick={onCancel}
        >
            <input
                type="hidden"
                name="gameIds"
                value={JSON.stringify(selectedGameIds)}
            />

            <Stack gap="sm" mt="md">
                {sortedGames.length > 0 ? (
                    <>
                        <Checkbox
                            label="Select All"
                            checked={
                                selectedGameIds.length === sortedGames.length
                            }
                            onChange={(e) =>
                                handleSelectAll(e.currentTarget.checked)
                            }
                            color={buttonColor}
                            fw={700}
                        />
                        <ScrollArea h="60vh" type="auto" offsetScrollbars>
                            <Checkbox.Group
                                value={selectedGameIds}
                                onChange={setSelectedGameIds}
                            >
                                <Stack gap="xs" mt="xs" mb="lg">
                                    {sortedGames.map((game) => {
                                        const gameDateFormatted =
                                            DateTime.fromISO(game.gameDate, {
                                                zone: game.timeZone || "utc",
                                            })
                                                .toFormat("M/d @ h:mma")
                                                .toLowerCase();
                                        return (
                                            <Checkbox.Card
                                                key={game.$id}
                                                value={game.$id}
                                                radius="md"
                                                p="sm"
                                                withBorder
                                            >
                                                <Group
                                                    wrap="nowrap"
                                                    align="center"
                                                    gap="md"
                                                >
                                                    <Checkbox.Indicator
                                                        color={buttonColor}
                                                        radius="sm"
                                                        size="md"
                                                    />
                                                    <Stack gap={2}>
                                                        <Text
                                                            fw={600}
                                                            size="md"
                                                        >
                                                            vs{" "}
                                                            {game.opponent ||
                                                                "TBD"}{" "}
                                                            {game.isHomeGame
                                                                ? "(H)"
                                                                : "(A)"}
                                                        </Text>
                                                        <Text
                                                            size="sm"
                                                            c="dimmed"
                                                        >
                                                            {gameDateFormatted}
                                                        </Text>
                                                    </Stack>
                                                </Group>
                                            </Checkbox.Card>
                                        );
                                    })}
                                </Stack>
                            </Checkbox.Group>
                        </ScrollArea>
                    </>
                ) : (
                    <Text>No games available to delete.</Text>
                )}
            </Stack>
        </FormWrapper>
    );
}
