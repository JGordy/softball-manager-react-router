import { useMemo, useState } from 'react';
import { Button, ScrollArea, Table } from '@mantine/core';

import styles from '../styles/playerChart.module.css';

const PlayerChart = ({ playerChart }) => {
    const [scrolled, setScrolled] = useState(false);

    const columns = useMemo(() => [
        {
            accessor: 'battingOrder',
            title: 'Batting Order',
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
                        {rows.map((row, index) => (
                            <Table.Tr key={index}>
                                {columns.map((column) => (
                                    <Table.Td key={column.accessor}>{row[column.accessor]}</Table.Td>
                                ))}
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </div>
    );
};

export default PlayerChart;