import { useState } from 'react';

import {
    Avatar,
    Table,
    ScrollArea,
} from '@mantine/core'

import styles from '@/styles/playerChart.module.css';

export default function PlayerList({ players }) {
    // console.log({ players });

    const [scrolled, setScrolled] = useState(false);

    const columns = [
        {
            accessor: 'initials',
            title: '',
        },
        {
            accessor: 'name',
            title: 'Name',
        },
        {
            accessor: 'positions',
            title: 'Positions'
        },
        {
            accessor: 'email',
            title: 'Email',
        },
    ];

    const headerClassName = scrolled ? styles.header + ' ' + styles.scrolled : styles.header;

    return (
        <div className={styles.tableContainer}>
            <ScrollArea mah={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead className={headerClassName}>
                        <Table.Tr>
                            {columns.map((column) => (
                                <Table.Th key={column.accessor}>{column.title}</Table.Th>
                            ))}
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {players.map((row) => {
                            const name = `${row.firstName} ${row.lastName}`;

                            return (
                                <Table.Tr key={row.$id}>
                                    <Table.Td>
                                        {/* TODO: Let users upload an avatar */}
                                        <Avatar name={name} alt={name} color="initials" />
                                    </Table.Td>
                                    <Table.Td>{name}</Table.Td>
                                    <Table.Td>{' '}</Table.Td>
                                    <Table.Td>{row.email}</Table.Td>
                                </Table.Tr>
                            )
                        })}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </div>
    )
};