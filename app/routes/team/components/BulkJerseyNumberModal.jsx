import {
    Group,
    Stack,
    TextInput,
    Text,
    Avatar,
    ScrollArea,
} from "@mantine/core";
import FormWrapper from "@/forms/FormWrapper";

export default function BulkJerseyNumberModal({
    players,
    teamId,
    primaryColor,
}) {
    // Helper to get formatted name
    const getPlayerName = (p) =>
        p.name ||
        `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
        "Unknown Player";

    // Sort players by name for easier finding
    const sortedPlayers = [...players].sort((a, b) =>
        getPlayerName(a).localeCompare(getPlayerName(b)),
    );

    return (
        <FormWrapper
            action="update-bulk-jersey-numbers"
            actionRoute={`/team/${teamId}`}
            confirmText="Update Numbers"
            buttonColor={primaryColor}
        >
            <ScrollArea h={400} offsetScrollbars>
                <Stack gap="md" pr="md">
                    {sortedPlayers.map((player) => {
                        const fullName = getPlayerName(player);
                        return (
                            <Group
                                key={player.$id}
                                justify="space-between"
                                wrap="nowrap"
                            >
                                <Group gap="sm" wrap="nowrap">
                                    <Avatar
                                        src={player.avatarUrl}
                                        name={fullName}
                                        radius="xl"
                                        size="sm"
                                        color="lime"
                                    />
                                    <Text size="sm" fw={500} truncate maw={180}>
                                        {fullName}
                                    </Text>
                                </Group>
                                <TextInput
                                    name={`jerseyNumber[${player.$id}]`}
                                    aria-label={fullName}
                                    placeholder="--"
                                    defaultValue={player.jerseyNumber || ""}
                                    size="xs"
                                    w={60}
                                    inputMode="numeric"
                                />
                            </Group>
                        );
                    })}
                </Stack>
            </ScrollArea>
        </FormWrapper>
    );
}
