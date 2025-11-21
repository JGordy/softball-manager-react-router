import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Group, Table, Text, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle, IconGripVertical } from "@tabler/icons-react";
import PositionSelect from "./PositionSelect";

const PlayerChartRow = ({
    row,
    index,
    managerView,
    columns,
    playerLookup,
    getPositionOptions,
    fieldingErrors,
    handlePositionChange,
    players,
}) => {
    return (
        <Draggable key={row.playerId} draggableId={row.playerId} index={index}>
            {(provided) => (
                <Table.Tr ref={provided.innerRef} {...provided.draggableProps}>
                    {provided.placeholder}
                    {managerView && (
                        <Table.Td>
                            <div {...provided.dragHandleProps}>
                                <IconGripVertical size={18} stroke={1.5} />
                            </div>
                        </Table.Td>
                    )}
                    {columns.map((column) => {
                        if (column.accessor.startsWith("inning")) {
                            const inning = column.accessor;
                            const player = playerLookup[row.playerId];

                            const preferredPositions =
                                player?.preferredPositions;
                            const dislikedPositions = player?.dislikedPositions;
                            const positionData = getPositionOptions(
                                preferredPositions,
                                dislikedPositions,
                            );

                            const isDuplicate = fieldingErrors?.[
                                inning
                            ]?.duplicates?.some(
                                (d) =>
                                    d.players.includes(row.playerId) &&
                                    d.position === row[inning],
                            );

                            return (
                                <Table.Td key={column.accessor}>
                                    {managerView ? (
                                        <PositionSelect
                                            row={row}
                                            inning={inning}
                                            handlePositionChange={
                                                handlePositionChange
                                            }
                                            positionData={positionData}
                                            players={players}
                                            error={isDuplicate}
                                        />
                                    ) : (
                                        <Text>{row[inning]}</Text>
                                    )}
                                </Table.Td>
                            );
                        } else if (column.accessor === "player") {
                            return (
                                <Table.Td key={column.accessor}>
                                    <Group gap="xs">
                                        <Text>{row.player}</Text>
                                        {row.hasBattingError && (
                                            <ThemeIcon
                                                color="red"
                                                variant="light"
                                                size="sm"
                                            >
                                                <IconAlertTriangle size={12} />
                                            </ThemeIcon>
                                        )}
                                    </Group>
                                </Table.Td>
                            );
                        } else {
                            return (
                                <Table.Td key={column.accessor}>
                                    {row[column.accessor]}
                                </Table.Td>
                            );
                        }
                    })}
                </Table.Tr>
            )}
        </Draggable>
    );
};

export default PlayerChartRow;
