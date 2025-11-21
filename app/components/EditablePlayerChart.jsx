import React, { useCallback, useMemo, useState } from "react";
import {
    Avatar,
    Group,
    ScrollArea,
    Select,
    Table,
    Text,
    ThemeIcon,
    Tooltip,
} from "@mantine/core";

import { IconAlertTriangle, IconGripVertical } from "@tabler/icons-react";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";

import fieldingPositions from "@/constants/positions";

import styles from "../styles/playerChart.module.css";

const PositionSelect = React.memo(
    ({ row, inning, handlePositionChange, positionData, players, error }) => {
        const playerLookup = useMemo(() => {
            // Create lookup map
            const lookup = {};
            players?.forEach((player) => {
                lookup[player.$id] = player;
            });
            return lookup;
        }, [players]);

        const renderSelectOption = useCallback(
            ({ option }) => {
                const player = playerLookup[row.playerId];

                let color = "gray";

                const preferredPositions = player?.preferredPositions;
                if (preferredPositions?.includes(option.value)) {
                    color = "green";
                }

                const dislikedPositions = player?.dislikedPositions;
                if (dislikedPositions?.includes(option.value)) {
                    color = "red";
                }

                if (option.value === "Out") {
                    color = "yellow";
                }

                return (
                    <Group gap="xs">
                        <Text c={color}>{option.label}</Text>
                    </Group>
                );
            },
            [players],
        );

        return (
            <Select
                key={`${row.player}-${inning}`}
                value={row[inning]}
                onChange={(event) =>
                    handlePositionChange(event, row.playerId, inning)
                }
                data={positionData}
                style={{ minWidth: "160px" }}
                renderOption={renderSelectOption}
                error={error}
            />
        );
    },
);

const EditablePlayerChart = ({
    handleLineupReorder,
    playerChart,
    setPlayerChart,
    managerView = false,
    players,
    validationResults,
}) => {
    const [inningPositions, setInningPositions] = useState({});

    // Create a player lookup map for performance
    const playerLookup = useMemo(() => {
        const lookup = {};
        players?.forEach((player) => {
            lookup[player.$id] = player;
        });
        return lookup;
    }, [players]);

    const columns = useMemo(
        () => [
            {
                accessor: "battingOrder",
                title: "",
            },
            {
                accessor: "player",
                title: "Player",
            },
            ...Array.from({ length: 7 }, (_, i) => ({
                accessor: `inning${i + 1}`,
                title: `Inning ${i + 1}`,
            })),
        ],
        [],
    );

    const { battingErrors, fieldingErrors } = validationResults || {};

    const rows = useMemo(() => {
        return playerChart.map((player, index) => {
            const inningPositionsForPlayer = inningPositions[player.$id] || {};
            const playerInningPositions = [];
            for (let i = 1; i <= 7; i++) {
                const inningKey = `inning${i}`;
                playerInningPositions.push(
                    inningPositionsForPlayer[inningKey] ||
                        player.positions[i - 1] ||
                        "Out",
                );
            }

            const row = {
                battingOrder: index + 1,
                playerId: player.$id,
                player: `${player.firstName} ${player.lastName}`,
                hasBattingError: battingErrors?.some(
                    (e) => e.playerId === player.$id,
                ),
            };
            playerInningPositions.forEach((position, i) => {
                row[`inning${i + 1}`] = position;
            });
            return row;
        });
    }, [playerChart, inningPositions, battingErrors]);

    const handlePositionChange = useCallback(
        (position, playerId, inning) => {
            setInningPositions((prevPositions) => {
                const updatedPositions = { ...prevPositions };
                if (!updatedPositions[playerId]) {
                    updatedPositions[playerId] = {};
                }
                updatedPositions[playerId][inning] = position;
                return updatedPositions;
            });

            setPlayerChart(position, playerId, inning);
        },
        [setPlayerChart],
    );

    const getPositionOptions = useCallback(
        (preferredPositions, dislikedPositions) => {
            if (!preferredPositions && !dislikedPositions) {
                return ["Out", ...Object.keys(fieldingPositions)];
            }

            const positions = [];
            if (preferredPositions.length > 0) {
                positions.push({
                    group: "Preferred Positions",
                    items: preferredPositions,
                });
            }

            positions.push({
                group: "Other Positions",
                items: Object.keys(fieldingPositions).filter(
                    (position) =>
                        !preferredPositions.includes(position) &&
                        !dislikedPositions.includes(position),
                ),
            });

            if (dislikedPositions?.length > 0) {
                positions.push({
                    group: "Disliked Positions",
                    items: dislikedPositions,
                });
            }

            return ["Out", ...positions];
        },
        [fieldingPositions],
    );

    if (!playerChart) {
        return null;
    }

    return (
        <>
            <div className={styles.tableContainer}>
                <DragDropContext onDragEnd={handleLineupReorder}>
                    <ScrollArea.Autosize mah={500}>
                        <Table withTableBorder>
                            <Table.Thead className={styles.header}>
                                <Table.Tr>
                                    {managerView && <Table.Th w={40} />}
                                    {columns.map((column) => (
                                        <Table.Th key={column.accessor}>
                                            {column.title}
                                        </Table.Th>
                                    ))}
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tfoot className={styles.footer}>
                                <Table.Tr className={styles.footerRow}>
                                    {managerView && <Table.Th />}
                                    <Table.Th />
                                    <Table.Th
                                        className={styles.footerCell}
                                        pt="md"
                                    >
                                        Missing Positions
                                    </Table.Th>
                                    {Array.from({ length: 7 }, (_, i) => {
                                        const inningKey = `inning${i + 1}`;
                                        const missing =
                                            fieldingErrors?.[inningKey]
                                                ?.missing || [];

                                        return (
                                            <Table.Th
                                                key={inningKey}
                                                className={styles.footerCell}
                                            >
                                                {missing.length > 0 && (
                                                    <Avatar.Group>
                                                        {missing.map((pos) => {
                                                            const initials =
                                                                fieldingPositions[
                                                                    pos
                                                                ]?.initials ||
                                                                pos;
                                                            return (
                                                                <Avatar
                                                                    key={pos}
                                                                    color="red"
                                                                    radius="xl"
                                                                    size="md"
                                                                >
                                                                    {initials}
                                                                </Avatar>
                                                            );
                                                        })}
                                                    </Avatar.Group>
                                                )}
                                            </Table.Th>
                                        );
                                    })}
                                </Table.Tr>
                            </Table.Tfoot>
                            <Droppable
                                droppableId="dnd-list"
                                direction="vertical"
                            >
                                {(provided) => (
                                    <Table.Tbody
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                    >
                                        {rows.map((row, index) => (
                                            <Draggable
                                                key={row.playerId}
                                                draggableId={row.playerId}
                                                index={index}
                                            >
                                                {(provided) => (
                                                    <Table.Tr
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                    >
                                                        {provided.placeholder}
                                                        {managerView && (
                                                            <Table.Td>
                                                                <div
                                                                    {...provided.dragHandleProps}
                                                                >
                                                                    <IconGripVertical
                                                                        size={
                                                                            18
                                                                        }
                                                                        stroke={
                                                                            1.5
                                                                        }
                                                                    />
                                                                </div>
                                                            </Table.Td>
                                                        )}
                                                        {columns.map(
                                                            (column) => {
                                                                if (
                                                                    column.accessor.startsWith(
                                                                        "inning",
                                                                    )
                                                                ) {
                                                                    const inning =
                                                                        column.accessor;
                                                                    const player =
                                                                        playerLookup[
                                                                            row
                                                                                .playerId
                                                                        ];

                                                                    const preferredPositions =
                                                                        player?.preferredPositions;
                                                                    const dislikedPositions =
                                                                        player?.dislikedPositions;
                                                                    const positionData =
                                                                        getPositionOptions(
                                                                            preferredPositions,
                                                                            dislikedPositions,
                                                                        );

                                                                    const isDuplicate =
                                                                        fieldingErrors?.[
                                                                            inning
                                                                        ]?.duplicates?.some(
                                                                            (
                                                                                d,
                                                                            ) =>
                                                                                d.players.includes(
                                                                                    row.playerId,
                                                                                ) &&
                                                                                d.position ===
                                                                                    row[
                                                                                        inning
                                                                                    ],
                                                                        );

                                                                    return (
                                                                        <Table.Td
                                                                            key={
                                                                                column.accessor
                                                                            }
                                                                        >
                                                                            {managerView ? (
                                                                                <PositionSelect
                                                                                    row={
                                                                                        row
                                                                                    }
                                                                                    inning={
                                                                                        inning
                                                                                    }
                                                                                    handlePositionChange={
                                                                                        handlePositionChange
                                                                                    }
                                                                                    positionData={
                                                                                        positionData
                                                                                    }
                                                                                    players={
                                                                                        players
                                                                                    }
                                                                                    error={
                                                                                        isDuplicate
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                <Text>
                                                                                    {
                                                                                        row[
                                                                                            inning
                                                                                        ]
                                                                                    }
                                                                                </Text>
                                                                            )}
                                                                        </Table.Td>
                                                                    );
                                                                } else if (
                                                                    column.accessor ===
                                                                    "player"
                                                                ) {
                                                                    return (
                                                                        <Table.Td
                                                                            key={
                                                                                column.accessor
                                                                            }
                                                                        >
                                                                            <Group gap="xs">
                                                                                <Text>
                                                                                    {
                                                                                        row.player
                                                                                    }
                                                                                </Text>
                                                                                {row.hasBattingError && (
                                                                                    <ThemeIcon
                                                                                        color="red"
                                                                                        variant="light"
                                                                                        size="sm"
                                                                                    >
                                                                                        <IconAlertTriangle
                                                                                            size={
                                                                                                12
                                                                                            }
                                                                                        />
                                                                                    </ThemeIcon>
                                                                                )}
                                                                            </Group>
                                                                        </Table.Td>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <Table.Td
                                                                            key={
                                                                                column.accessor
                                                                            }
                                                                        >
                                                                            {
                                                                                row[
                                                                                    column
                                                                                        .accessor
                                                                                ]
                                                                            }
                                                                        </Table.Td>
                                                                    );
                                                                }
                                                            },
                                                        )}
                                                    </Table.Tr>
                                                )}
                                            </Draggable>
                                        ))}
                                    </Table.Tbody>
                                )}
                            </Droppable>
                        </Table>
                    </ScrollArea.Autosize>
                </DragDropContext>
            </div>
        </>
    );
};

export default EditablePlayerChart;
