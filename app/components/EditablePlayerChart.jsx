import React, { useCallback, useMemo, useState } from 'react';
import {
    ActionIcon,
    Button,
    Group,
    ScrollArea,
    Select,
    Table,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import {
    IconGripVertical,
    IconTrash,
} from '@tabler/icons-react';

import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';

import fieldingPositions from '@/constants/positions';

import DrawerContainer from '@/components/DrawerContainer';

import styles from '../styles/playerChart.module.css';

const PositionSelect = React.memo(({
    row,
    inning,
    handlePositionChange,
    positionData,
    playerChart,
}) => {

    const playerLookup = useMemo(() => {  // Create lookup map
        const lookup = {};
        playerChart.forEach(player => {
            lookup[player.$id] = player;
        });
        return lookup;
    }, [playerChart]);

    const renderSelectOption = useCallback(({ option }) => {

        const player = playerLookup[row.playerId];

        let color = 'gray';

        const preferredPositions = player?.preferredPositions;
        if (preferredPositions?.includes(option.value)) {
            color = 'green';
        }

        const dislikedPositions = player?.dislikedPositions;
        if (dislikedPositions?.includes(option.value)) {
            color = 'red';
        }

        if (option.value === 'Out') {
            color = 'yellow';
        }


        return (
            <Group gap="xs">
                <Text c={color}>{option.label}</Text>
            </Group>
        );
    }, [playerChart]);

    return (
        <Select
            key={`${row.player}-${inning}`}
            value={row[inning]}
            onChange={(event) => handlePositionChange(event, row.playerId, inning)}
            data={positionData}
            style={{ minWidth: '160px' }}
            renderOption={renderSelectOption}
        />
    );
});

const EditablePlayerChart = ({
    handleLineupReorder,
    playerChart,
    setPlayerChart,
    managerView = false,
}) => {

    const [removePlayerDrawerOpened, removePlayerHandlers] = useDisclosure(false);

    const [inningPositions, setInningPositions] = useState({});
    const [playerToRemove, setPlayerToRemove] = useState(null);

    const openConfirmationDrawer = (player) => {
        setPlayerToRemove(player);
        removePlayerHandlers.open();
    };

    const confirmRemoveAndClose = () => {
        if (playerToRemove) {
            handleRemovePlayer(playerToRemove.playerId);
        }
        setPlayerToRemove(null);
        removePlayerHandlers.close();
    };

    const columns = useMemo(() => [
        {
            accessor: 'battingOrder',
            title: '',
        },
        {
            accessor: 'player',
            title: 'Player',
        },
        ...Array.from({ length: 7 }, (_, i) => ({
            accessor: `inning${i + 1}`,
            title: `Inning ${i + 1}`,
        })),
    ], []);

    const rows = useMemo(() => {
        return playerChart.map((player, index) => {
            const inningPositionsForPlayer = inningPositions[player.$id] || {};
            const playerInningPositions = [];
            for (let i = 1; i <= 7; i++) {
                const inningKey = `inning${i}`;
                playerInningPositions.push(inningPositionsForPlayer[inningKey] || player.positions[i - 1] || 'Out');
            }

            const row = {
                battingOrder: index + 1,
                playerId: player.$id,
                player: `${player.firstName} ${player.lastName}`,
            };
            playerInningPositions.forEach((position, i) => {
                row[`inning${i + 1}`] = position;
            });
            return row;
        });
    }, [playerChart, inningPositions]);

    const handlePositionChange = useCallback((position, playerId, inning) => {
        setInningPositions(prevPositions => {
            const updatedPositions = { ...prevPositions };
            if (!updatedPositions[playerId]) {
                updatedPositions[playerId] = {};
            }
            updatedPositions[playerId][inning] = position;
            return updatedPositions;
        });

        setPlayerChart(position, playerId, inning);

    }, [setPlayerChart]);

    const getPositionOptions = useCallback((preferredPositions, dislikedPositions) => {

        if (!preferredPositions && !dislikedPositions) {
            return ['Out', ...Object.keys(fieldingPositions)];
        }

        const positions = [];
        if (preferredPositions.length > 0) {
            positions.push({ group: 'Preferred Positions', items: preferredPositions });
        }

        positions.push({ group: 'Other Positions', items: Object.keys(fieldingPositions).filter(position => (!preferredPositions.includes(position) && !dislikedPositions.includes(position))) });

        if (dislikedPositions?.length > 0) {
            positions.push({ group: 'Disliked Positions', items: dislikedPositions });
        }

        return [
            'Out',
            ...positions,
        ];
    }, [fieldingPositions]);

    if (!playerChart) {
        return null;
    }

    return (
        <>
            <div className={styles.tableContainer}>
                <DragDropContext onDragEnd={handleLineupReorder}>
                    <ScrollArea.Autosize mah={475}>
                        <Table withTableBorder>
                            <Table.Thead className={styles.header}>
                                <Table.Tr>
                                    {managerView && <Table.Th w={40} />}
                                    {managerView && <Table.Th w={40} />}
                                    {columns.map((column) => (
                                        <Table.Th key={column.accessor}>{column.title}</Table.Th>
                                    ))}
                                </Table.Tr>
                            </Table.Thead>
                            <Droppable droppableId="dnd-list" direction="vertical">
                                {(provided) => (
                                    <Table.Tbody {...provided.droppableProps} ref={provided.innerRef}>
                                        {rows.map((row, index) => (
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
                                                        {managerView && (
                                                            <Table.Td>
                                                                <ActionIcon
                                                                    color="red"
                                                                    onClick={() => openConfirmationDrawer(row)}
                                                                    variant="subtle"
                                                                >
                                                                    <IconTrash size={18} />
                                                                </ActionIcon>
                                                            </Table.Td>
                                                        )}
                                                        {columns.map((column) => {
                                                            if (column.accessor.startsWith('inning')) {
                                                                const inning = column.accessor;
                                                                const player = playerChart.find(p => p.firstName + ' ' + p.lastName === row.player);

                                                                const preferredPositions = player?.preferredPositions;
                                                                const dislikedPositions = player?.dislikedPositions;
                                                                const positionData = getPositionOptions(preferredPositions, dislikedPositions);

                                                                return (
                                                                    <Table.Td key={column.accessor}>
                                                                        {managerView ? (
                                                                            <PositionSelect
                                                                                row={row}
                                                                                inning={inning}
                                                                                handlePositionChange={handlePositionChange}
                                                                                positionData={positionData}
                                                                                playerChart={playerChart}
                                                                            />
                                                                        ) : (
                                                                            <Text>{row[inning]}</Text>
                                                                        )}
                                                                    </Table.Td>
                                                                );
                                                            } else {
                                                                return <Table.Td key={column.accessor}>{row[column.accessor]}</Table.Td>;
                                                            }
                                                        })}
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

            {managerView && (
                <DrawerContainer
                    opened={removePlayerDrawerOpened}
                    onClose={removePlayerHandlers.close}
                    title="Confirm Removal"
                    size="xs"
                >
                    <Text>Are you sure you want to remove {playerToRemove?.player} from the lineup?</Text>
                    <Group justify="space-between" mt="xl" grow>
                        <Button variant="outline" onClick={removePlayerHandlers.close}>Cancel</Button>
                        <Button color="red" onClick={confirmRemoveAndClose}>Yes, Remove</Button>
                    </Group>
                </DrawerContainer>
            )}
        </>
    );
};

export default EditablePlayerChart;