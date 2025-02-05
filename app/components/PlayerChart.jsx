import { useMemo, useState } from 'react';
import {
    Group,
    ScrollArea,
    Select,
    Table,
    Text,
} from '@mantine/core';

import fieldingPositions from '@/constants/positions';

import styles from '../styles/playerChart.module.css';

const PlayerChart = ({ playerChart, setPlayerChart }) => {
    const [scrolled, setScrolled] = useState(false);

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

    const rows = useMemo(() => playerChart?.map((player, index) => {
        return {
            battingOrder: index + 1,
            player: player.name,
            ...Array.from({ length: 7 }, (_, i) => ({
                [`inning${i + 1}`]: player.positions[i] || 'Out',
            })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
        };
    }), [playerChart]);

    const handlePositionChange = (playerName, inning, position) => {
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
    };

    const headerClassName = scrolled ? styles.header + ' ' + styles.scrolled : styles.header;

    if (!playerChart) {
        return null;
    }

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

                                        const renderSelectOption = ({ option, checked }) => {
                                            const player = playerChart.find(p => p.name === row.player);
                                            const preferredPositions = player?.preferredPositions;
                                            const isPreferred = preferredPositions?.includes(option.value) || option.value === "Out";

                                            return (
                                                <Group noWrap spacing={0}>
                                                    <Text style={isPreferred ? { color: 'green' } : { color: 'red' }}>{option.label}</Text> {/* Display option.label */}
                                                </Group>
                                            );
                                        };

                                        return (
                                            <Table.Td key={column.accessor}>
                                                <Select
                                                    value={row[column.accessor]}
                                                    onChange={(value) => handlePositionChange(row.player, inning, value)}
                                                    data={['Out', ...fieldingPositions]}
                                                    style={{ minWidth: '150px' }}
                                                    renderOption={renderSelectOption}
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