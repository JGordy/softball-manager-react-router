import { useState } from "react";
import {
    TextInput,
    Stack,
    Group,
    Text,
    ColorSwatch,
    UnstyledButton,
    Badge,
} from "@mantine/core";
import { IconSearch, IconChevronRight } from "@tabler/icons-react";
import useModal from "@/hooks/useModal";
import classes from "./TeamSearchModal.module.css";

/**
 * TeamSearchModal - Allows quick searching and switching between user teams.
 * Designed to be rendered inside the project's useModal() wrapper.
 *
 * @param {Object} props
 * @param {Array} props.teamList - List of teams
 * @param {Function} props.onSelectTeam - Handler when a team is selected
 * @param {Function} [props.onClose] - Optional close modal handler
 * @returns {JSX.Element}
 */
export default function TeamSearchModal({
    teamList = [],
    onSelectTeam,
    onClose,
}) {
    const { closeAllModals } = useModal();
    const [query, setQuery] = useState("");

    const filteredTeams = teamList.filter((team) =>
        team.name.toLowerCase().includes(query.toLowerCase().trim()),
    );

    const handleSelectTeam = (teamId) => {
        if (onSelectTeam) onSelectTeam(teamId);
        if (onClose) {
            onClose();
        } else {
            closeAllModals();
        }
    };

    return (
        <Stack gap="md" pt="xs">
            <TextInput
                placeholder="Search teams..."
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                leftSection={
                    <IconSearch size={16} color="var(--soft-lime-color)" />
                }
                radius="xl"
                autoFocus
            />

            <Stack gap="xs" mah={300} style={{ overflowY: "auto" }}>
                {filteredTeams.length === 0 ? (
                    <Text c="dimmed" size="sm" ta="center" py="md">
                        No teams matching &quot;{query}&quot;
                    </Text>
                ) : (
                    filteredTeams.map((team) => (
                        <UnstyledButton
                            key={team.$id}
                            onClick={() => handleSelectTeam(team.$id)}
                            className={classes.teamItem}
                        >
                            <Group justify="space-between" align="center">
                                <Group gap="sm">
                                    <ColorSwatch
                                        color={team.primaryColor || "#CCFF00"}
                                        size={14}
                                    />
                                    <Text fw={600} size="sm">
                                        {team.name}
                                    </Text>
                                </Group>
                                <Group gap="xs">
                                    {team.isManager && (
                                        <Badge
                                            size="xs"
                                            variant="light"
                                            color="lime"
                                        >
                                            Manager
                                        </Badge>
                                    )}
                                    <IconChevronRight
                                        size={16}
                                        className={classes.chevron}
                                    />
                                </Group>
                            </Group>
                        </UnstyledButton>
                    ))
                )}
            </Stack>
        </Stack>
    );
}
