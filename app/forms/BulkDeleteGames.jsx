import { useState } from "react";
import { Checkbox, Text, Stack, ScrollArea, Card, Group } from "@mantine/core";
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
                    ? `Delete ${selectedGameIds.length} Games`
                    : "Delete Games"
            }
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
                        <ScrollArea h="50vh" type="auto" offsetScrollbars>
                            <Stack gap="xs" mt="xs" mb="lg">
                                {sortedGames.map((game) => {
                                    const gameDateFormatted = DateTime.fromISO(
                                        game.gameDate,
                                        { zone: game.timeZone || "utc" },
                                    ).toLocaleString(DateTime.DATETIME_MED);
                                    const isSelected = selectedGameIds.includes(
                                        game.$id,
                                    );
                                    return (
                                        <Card
                                            key={game.$id}
                                            withBorder
                                            padding="sm"
                                            radius="md"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedGameIds((prev) =>
                                                        prev.filter(
                                                            (id) =>
                                                                id !== game.$id,
                                                        ),
                                                    );
                                                } else {
                                                    setSelectedGameIds(
                                                        (prev) => [
                                                            ...prev,
                                                            game.$id,
                                                        ],
                                                    );
                                                }
                                            }}
                                            style={{
                                                cursor: "pointer",
                                                borderColor: isSelected
                                                    ? "var(--mantine-color-red-6)"
                                                    : undefined,
                                            }}
                                        >
                                            <Group wrap="nowrap">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    style={{
                                                        pointerEvents: "none",
                                                    }}
                                                    color={buttonColor}
                                                />
                                                <Stack gap={0}>
                                                    <Text fw={500}>
                                                        {gameDateFormatted} vs{" "}
                                                        {game.opponent || "TBD"}
                                                    </Text>
                                                    <Text size="sm" c="dimmed">
                                                        {game.isHomeGame
                                                            ? "Home Game"
                                                            : "Away Game"}
                                                    </Text>
                                                </Stack>
                                            </Group>
                                        </Card>
                                    );
                                })}
                            </Stack>
                        </ScrollArea>
                    </>
                ) : (
                    <Text>No games available to delete.</Text>
                )}
            </Stack>
        </FormWrapper>
    );
}
