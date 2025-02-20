import { useState } from 'react';

// import { Link } from "react-router";

import {
    Avatar,
    Button,
    Card,
    Table,
    Tooltip,
    ScrollArea,
} from '@mantine/core'

import positions from '@/constants/positions';

// import { IconLink } from '@tabler/icons-react';

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
        accessor: 'role',
        title: 'Role',
    },
    {
        accessor: 'email',
        title: 'Email',
        restricted: true,
    },
];

export default function PlayerList({
    players,
    coachId,
    coachView,
    handlePlayerListModal,
    primaryColor,
}) {

    const [scrolled, setScrolled] = useState(false);

    const headerClassName = scrolled ? styles.header + ' ' + styles.scrolled : styles.header;

    return (
        <>
            <Card mt="sm" radius="md" padding="xs" withBorder>
                <ScrollArea mah={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
                    <Table striped highlightOnHover withTableBorder>
                        <Table.Thead className={headerClassName}>
                            <Table.Tr>
                                {columns.map((column) => {
                                    const showColumn = !column.restricted || (column.restricted && coachView)
                                    return showColumn && (
                                        <Table.Th key={column.accessor}>{column.title}</Table.Th>
                                    )
                                })}
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
                                        <Table.Td>
                                            {/* <Link to={`/user/${player.$id}`}> */}
                                            {name}
                                            {/* </Link> */}
                                        </Table.Td>
                                        <Table.Td>
                                            <Avatar.Group>
                                                {player?.preferredPositions?.map(position => (
                                                    <Tooltip key={player.$id + position} label={position} withArrow>
                                                        <Avatar name={positions[position].initials} alt={position} color="initials" />
                                                    </Tooltip>
                                                ))}
                                            </Avatar.Group>
                                        </Table.Td>
                                        <Table.Td>{player.$id === coachId ? 'Coach' : 'Player'}</Table.Td>
                                        {coachView && <Table.Td>{player.email}</Table.Td>}
                                    </Table.Tr>
                                )
                            })}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>
            </Card>

            {coachView && (
                <Button
                    mt="md"
                    color={primaryColor}
                    onClick={handlePlayerListModal}
                    autoContrast
                    fullWidth
                >
                    Add Player
                </Button>
            )}
        </>
    )
};