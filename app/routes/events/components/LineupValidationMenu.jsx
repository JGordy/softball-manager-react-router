import {
    ActionIcon,
    Badge,
    Divider,
    Indicator,
    Menu,
    ScrollArea,
    Text,
    ThemeIcon,
} from "@mantine/core";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react";

export default function LineupValidationMenu({ validationResults }) {
    const { summary } = validationResults || {};

    const battingSummary =
        summary?.filter((s) => s.startsWith("Batting Order")) || [];
    const fieldingSummary =
        summary?.filter((s) => s.startsWith("Inning")) || [];

    const errorCount = battingSummary.length + fieldingSummary.length;
    const hasErrors = errorCount > 0;

    return (
        <Menu
            shadow="md"
            width={400}
            position="bottom-end"
            radius="lg"
            arrowOffset={57}
            withArrow
        >
            <Menu.Target>
                <Indicator
                    color="red"
                    label={errorCount}
                    size={18}
                    disabled={!hasErrors}
                >
                    <ActionIcon
                        radius="xl"
                        variant="light"
                        color={hasErrors ? "red" : "green"}
                        size="lg"
                        aria-label="Lineup Validation"
                    >
                        {hasErrors ? (
                            <IconAlertTriangle size={20} />
                        ) : (
                            <IconCheck size={20} />
                        )}
                    </ActionIcon>
                </Indicator>
            </Menu.Target>

            <Menu.Dropdown p="md">
                {!hasErrors && (
                    <>
                        <Menu.Label>Lineup Validation</Menu.Label>
                        <Menu.Item
                            leftSection={<IconCheck size={14} color="green" />}
                        >
                            <Text size="sm">No issues found</Text>
                        </Menu.Item>
                    </>
                )}

                {hasErrors && (
                    <ScrollArea.Autosize mah="50vh">
                        {battingSummary.length > 0 && (
                            <>
                                <Menu.Label>Batting Order</Menu.Label>
                                {battingSummary.map((error, index) => (
                                    <Menu.Item
                                        key={`batting-${index}`}
                                        style={{ whiteSpace: "normal" }}
                                    >
                                        <Text size="sm" lh={1.4}>
                                            {error.replace(
                                                "Batting Order: ",
                                                "",
                                            )}
                                        </Text>
                                    </Menu.Item>
                                ))}
                            </>
                        )}

                        {battingSummary.length > 0 &&
                            fieldingSummary.length > 0 && <Divider my="md" />}

                        {fieldingSummary.length > 0 && (
                            <>
                                <Menu.Label>Fielding Chart</Menu.Label>
                                {fieldingSummary.map((error, index) => (
                                    <Menu.Item
                                        key={`fielding-${index}`}
                                        style={{ whiteSpace: "normal" }}
                                    >
                                        <Text size="sm" lh={1.4}>
                                            {error}
                                        </Text>
                                    </Menu.Item>
                                ))}
                            </>
                        )}
                    </ScrollArea.Autosize>
                )}
            </Menu.Dropdown>
        </Menu>
    );
}
