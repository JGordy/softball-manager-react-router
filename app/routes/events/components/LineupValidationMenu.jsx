import {
    ActionIcon,
    Divider,
    Indicator,
    Menu,
    ScrollArea,
    Text,
} from "@mantine/core";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react";

const getOrdinal = (number) => {
    const suffixes = ["th", "st", "nd", "rd"];
    const lastTwoDigits = number % 100;
    return (
        number +
        (suffixes[(lastTwoDigits - 20) % 10] ||
            suffixes[lastTwoDigits] ||
            suffixes[0])
    );
};

export default function LineupValidationMenu({ validationResults }) {
    const { battingErrors = [], fieldingErrors = {} } = validationResults || {};

    const hasBattingErrors = battingErrors.length > 0;
    const hasFieldingErrors = Object.values(fieldingErrors).some(
        (e) => e.duplicates.length > 0 || e.missing.length > 0,
    );
    const hasErrors = hasBattingErrors || hasFieldingErrors;

    // Calculate error count for badge
    let errorCount = battingErrors.length;
    Object.values(fieldingErrors).forEach((e) => {
        errorCount += e.duplicates.length;
        if (e.missing.length > 0) errorCount += 1; // Count missing block as 1 error per inning? Or per missing pos?
        // Original logic was based on summary lines.
        // Summary had 1 line for "Missing X, Y" or "Missing all".
        // So 1 per inning if missing > 0.
    });

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
                        {hasBattingErrors && (
                            <>
                                <Menu.Label>Batting Order</Menu.Label>
                                {battingErrors.map((error, index) => (
                                    <Menu.Item
                                        key={`batting-${index}`}
                                        style={{ whiteSpace: "normal" }}
                                    >
                                        <Text size="sm" lh={1.4}>
                                            <Text span c="red" fw={500}>
                                                {error.playerName}
                                            </Text>{" "}
                                            is the {getOrdinal(error.count)}{" "}
                                            consecutive male batter.
                                        </Text>
                                    </Menu.Item>
                                ))}
                            </>
                        )}

                        {hasBattingErrors && hasFieldingErrors && (
                            <Divider my="md" />
                        )}

                        {hasFieldingErrors && (
                            <>
                                <Menu.Label>Fielding Chart</Menu.Label>
                                {Object.entries(fieldingErrors).map(
                                    ([key, data]) => {
                                        const inningNum = key.replace(
                                            "inning",
                                            "",
                                        );
                                        const { duplicates, missing } = data;

                                        if (
                                            duplicates.length === 0 &&
                                            missing.length === 0
                                        ) {
                                            return null;
                                        }

                                        return (
                                            <div key={key}>
                                                {duplicates.map((d, i) => (
                                                    <Menu.Item
                                                        key={`dup-${key}-${i}`}
                                                        style={{
                                                            whiteSpace:
                                                                "normal",
                                                        }}
                                                    >
                                                        <Text
                                                            size="sm"
                                                            lh={1.4}
                                                        >
                                                            <Text span fw={700}>
                                                                Inning{" "}
                                                                {inningNum}:
                                                            </Text>{" "}
                                                            <Text
                                                                span
                                                                c="red"
                                                                fw={500}
                                                            >
                                                                {d.position}
                                                            </Text>{" "}
                                                            is assigned to{" "}
                                                            {d.playerNames.map(
                                                                (name, idx) => (
                                                                    <span
                                                                        key={
                                                                            idx
                                                                        }
                                                                    >
                                                                        {idx > 0
                                                                            ? " and "
                                                                            : ""}
                                                                        <Text
                                                                            span
                                                                            c="red"
                                                                            fw={
                                                                                500
                                                                            }
                                                                        >
                                                                            {
                                                                                name
                                                                            }
                                                                        </Text>
                                                                    </span>
                                                                ),
                                                            )}
                                                            .
                                                        </Text>
                                                    </Menu.Item>
                                                ))}
                                                {missing.length > 0 && (
                                                    <Menu.Item
                                                        key={`missing-${key}`}
                                                        style={{
                                                            whiteSpace:
                                                                "normal",
                                                        }}
                                                    >
                                                        <Text
                                                            size="sm"
                                                            lh={1.4}
                                                        >
                                                            <Text span fw={700}>
                                                                Inning{" "}
                                                                {inningNum}:
                                                            </Text>{" "}
                                                            {missing.length ===
                                                            10 ? (
                                                                <Text
                                                                    span
                                                                    c="red"
                                                                    fw={500}
                                                                >
                                                                    Missing all
                                                                    field
                                                                    positions
                                                                </Text>
                                                            ) : (
                                                                <>
                                                                    Missing{" "}
                                                                    {missing.map(
                                                                        (
                                                                            pos,
                                                                            idx,
                                                                        ) => (
                                                                            <span
                                                                                key={
                                                                                    idx
                                                                                }
                                                                            >
                                                                                {idx >
                                                                                0
                                                                                    ? ", "
                                                                                    : ""}
                                                                                <Text
                                                                                    span
                                                                                    c="red"
                                                                                    fw={
                                                                                        500
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        pos
                                                                                    }
                                                                                </Text>
                                                                            </span>
                                                                        ),
                                                                    )}
                                                                </>
                                                            )}
                                                            .
                                                        </Text>
                                                    </Menu.Item>
                                                )}
                                            </div>
                                        );
                                    },
                                )}
                            </>
                        )}
                    </ScrollArea.Autosize>
                )}
            </Menu.Dropdown>
        </Menu>
    );
}
