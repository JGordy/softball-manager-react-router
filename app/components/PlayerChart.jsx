import React, { useCallback, useMemo, useState } from 'react';
import {
    Group,
    ScrollArea,
    Select,
    Table,
    Text,
} from '@mantine/core';

import fieldingPositions from '@/constants/positions';

import styles from '../styles/playerChart.module.css';

const PositionSelect = React.memo(({ row, inning, handlePositionChange, positionData, playerChart }) => {
    const renderSelectOption = useCallback(({ option, checked }) => {
        const player = playerChart.find(p => p.name === row.player);
        const preferredPositions = player?.preferredPositions;
        const isPreferred = preferredPositions?.includes(option.value);

        let color = 'gray';
        if (option.value !== "Out") {
            color = isPreferred ? 'green' : 'red';
        }

        return (
            <Group spacing={0}>
                <Text style={{ color }}>{option.label}</Text>
            </Group>
        );
    }, [playerChart]); // Add playerChart as dependency

    return (
        <Select
            key={`${row.player}-${inning}`}
            value={row[inning]}
            onChange={(event) => handlePositionChange(event, row.player, inning)}
            data={positionData}
            style={{ minWidth: '160px' }}
            renderOption={renderSelectOption}
        />
    );
});

const PlayerChart = ({ playerChart, setPlayerChart }) => {
    const [scrolled, setScrolled] = useState(false);
    const [inningPositions, setInningPositions] = useState({});

    const columns = useMemo(() => [
        {
            accessor: 'battingOrder',
            title: 'Batting',
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
            const playerInningPositions = Array.from({ length: 7 }, (_, i) => {
                const inningKey = `inning${i + 1}`;
                return inningPositions[player.name]?.[inningKey] || player.positions[i] || 'Out';
            });

            return {
                battingOrder: index + 1,
                player: player.name,
                ...playerInningPositions.reduce((acc, position, i) => {
                    acc[`inning${i + 1}`] = position;
                    return acc;
                }, {}),
            };
        });
    }, [playerChart, inningPositions]);

    const handlePositionChange = useCallback((position, playerName, inning) => {
        console.log('Handle position change!', { playerName, inning, newPosition: position });
        setInningPositions(prevPositions => {
            const updatedPositions = { ...prevPositions };
            if (!updatedPositions[playerName]) {
                updatedPositions[playerName] = {};
            }
            updatedPositions[playerName][inning] = position;
            return updatedPositions;
        });

        setPlayerChart(prevChart => {
            return prevChart.map(player => {
                if (player.name === playerName) {
                    const inningIndex = parseInt(inning.replace('inning', ''), 10) - 1;
                    const updatedPositions = [...player.positions];
                    updatedPositions[inningIndex] = position;
                    return { ...player, positions: updatedPositions };
                }
                return player;
            });
        });
    }, [setPlayerChart]);

    const getPositionOptions = useCallback((preferredPositions) => {
        if (!preferredPositions) {
            return ['Out', ...fieldingPositions];
        }

        const preferred = [...preferredPositions];
        const nonPreferred = fieldingPositions.filter(position => !preferred.includes(position));

        return [
            { group: 'Preferred Positions', items: preferred },
            { group: 'Other Positions', items: nonPreferred },
            'Out',
        ];
    }, [fieldingPositions]);

    const headerClassName = scrolled ? styles.header + ' ' + styles.scrolled : styles.header;

    if (!playerChart) {
        return null;
    }

    console.log({ playerChart });

    return (
        <div className={styles.tableContainer}>
            <ScrollArea mih={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
                <Table>
                    <Table.Thead className={headerClassName}>
                        <Table.Tr>
                            {columns.map((column) => (
                                <Table.Th key={column.accessor}>{column.title}</Table.Th>
                            ))}
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {rows.map((row) => (
                            <Table.Tr key={row.player}>
                                {columns.map((column) => {
                                    if (column.accessor.startsWith('inning')) {
                                        const inning = column.accessor;
                                        const player = playerChart.find(p => p.name === row.player);
                                        const preferredPositions = player?.preferredPositions;
                                        const positionData = getPositionOptions(preferredPositions);

                                        return (
                                            <Table.Td key={column.accessor}>
                                                <PositionSelect
                                                    row={row}
                                                    inning={inning}
                                                    handlePositionChange={handlePositionChange}
                                                    positionData={positionData}
                                                    playerChart={playerChart}
                                                />
                                            </Table.Td>
                                        );
                                    } else {
                                        return <Table.Td key={column.accessor}>{row[column.accessor]}</Table.Td>;
                                    }
                                })}
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </div>
    );
};

export default PlayerChart;