import {
    ActionIcon,
    Menu,
    SegmentedControl,
    useComputedColorScheme,
} from "@mantine/core";
import { IconAdjustments } from "@tabler/icons-react";

export default function EventsFilter({
    teamsData,
    filterId,
    onFilterChange,
    showFilters,
    onToggleFilters,
    onCloseFilters,
}) {
    const computedColorScheme = useComputedColorScheme("light");

    if (!teamsData || teamsData.length <= 1) {
        return null;
    }

    return (
        <Menu
            position="bottom-end"
            offset={10}
            opened={showFilters}
            onClose={onCloseFilters}
            trigger="click"
            radius="lg"
        >
            <Menu.Target>
                <ActionIcon
                    variant="light"
                    color="lime"
                    radius="xl"
                    aria-label="Filter Games"
                    size="lg"
                    onClick={onToggleFilters}
                >
                    <IconAdjustments stroke={1.5} size={24} />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown
                bg={computedColorScheme === "light" ? "gray.1" : undefined}
                py="md"
                px="xs"
            >
                <Menu.Label>Filter Games by Team</Menu.Label>
                <SegmentedControl
                    styles={{ label: { marginBottom: "10px" } }}
                    fullWidth
                    color="lime"
                    transitionDuration={0}
                    withItemsBorders={false}
                    orientation="vertical"
                    onChange={onFilterChange}
                    value={filterId}
                    radius="md"
                    size="md"
                    p="xs"
                    data={[
                        { value: "all", label: "All Teams" },
                        ...teamsData.map((team) => ({
                            value: team.$id,
                            label: team.name,
                        })),
                    ]}
                />
            </Menu.Dropdown>
        </Menu>
    );
}
