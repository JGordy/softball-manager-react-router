import { useState } from 'react';

import {
    Avatar,
    Table,
    Tooltip,
    ScrollArea,
} from '@mantine/core'

import styles from '@/styles/playerChart.module.css';

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

export default function PlayerList({ players }) {
    // console.log({ players });

    const [scrolled, setScrolled] = useState(false);

    const headerClassName = scrolled ? styles.header + ' ' + styles.scrolled : styles.header;

    return (
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
                    {players.map((player) => {
                        const name = `${player.firstName} ${player.lastName}`;

                        return (
                            <Table.Tr key={player.$id}>
                                <Table.Td>
                                    {/* TODO: Let users upload an avatar */}
                                    <Avatar name={name} alt={name} color="initials" />
                                </Table.Td>
                                <Table.Td>{name}</Table.Td>
                                {/* TODO: List preferred positions here */}
                                <Table.Td>
                                    <Avatar.Group>
                                        {player?.preferredPositions?.map(position => (
                                            <Tooltip label={position} withArrow>
                                                <Avatar key={position} name={position} alt={position} color="initials" />
                                            </Tooltip>
                                        ))}
                                    </Avatar.Group>
                                </Table.Td>
                                <Table.Td>{player.email}</Table.Td>
                            </Table.Tr>
                        )
                    })}
                </Table.Tbody>
            </Table>
        </ScrollArea>
    )
};