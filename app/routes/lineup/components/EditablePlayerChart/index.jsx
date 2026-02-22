import React, { useCallback, useMemo, useState } from "react";
import { ScrollArea, Table } from "@mantine/core";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import fieldingPositions from "@/constants/positions";
import styles from "@/styles/playerChart.module.css";
import PlayerChartFooter from "./PlayerChartFooter";
import PlayerChartRow from "./PlayerChartRow";

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
        (preferredPositionsArg, dislikedPositionsArg) => {
            // Ensure we're working with unique arrays and handle potential null/undefined
            const preferredPositions = Array.isArray(preferredPositionsArg)
                ? [...new Set(preferredPositionsArg)].filter(
                      (p) => p && p !== "Out",
                  )
                : [];

            // A position cannot be both preferred and disliked; preferred takes precedence
            const dislikedPositions = Array.isArray(dislikedPositionsArg)
                ? [...new Set(dislikedPositionsArg)].filter(
                      (p) =>
                          p && p !== "Out" && !preferredPositions.includes(p),
                  )
                : [];

            if (
                preferredPositions.length === 0 &&
                dislikedPositions.length === 0
            ) {
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

            if (dislikedPositions.length > 0) {
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
                        <Droppable droppableId="dnd-list" direction="vertical">
                            {(provided) => (
                                <Table.Tbody
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                >
                                    {rows.map((row, index) => (
                                        <PlayerChartRow
                                            key={row.playerId}
                                            row={row}
                                            index={index}
                                            managerView={managerView}
                                            columns={columns}
                                            playerLookup={playerLookup}
                                            getPositionOptions={
                                                getPositionOptions
                                            }
                                            fieldingErrors={fieldingErrors}
                                            handlePositionChange={
                                                handlePositionChange
                                            }
                                            players={players}
                                        />
                                    ))}
                                    {provided.placeholder}
                                </Table.Tbody>
                            )}
                        </Droppable>
                        <PlayerChartFooter
                            managerView={managerView}
                            fieldingErrors={fieldingErrors}
                        />
                    </Table>
                </ScrollArea.Autosize>
            </DragDropContext>
        </div>
    );
};

export default EditablePlayerChart;
