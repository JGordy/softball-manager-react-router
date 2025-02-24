import { useState } from 'react';

import { Link } from "react-router";

import {
    Avatar,
    Button,
    Card,
    Flex,
    Stack,
    Table,
    Text,
    Tooltip,
    ScrollArea,
} from '@mantine/core'

import positions from '@/constants/positions';

import { IconPlus } from '@tabler/icons-react';

// import styles from '@/styles/playerChart.module.css';

// const columns = [
//     {
//         accessor: 'name',
//         title: 'Name',
//         width: 100,
//     },
//     {
//         accessor: 'positions',
//         title: 'Positions'
//     },
//     {
//         accessor: 'role',
//         title: 'Role',
//     },
//     {
//         accessor: 'email',
//         title: 'Email',
//         restricted: true,
//     },
//     {
//         accessor: 'phoneNumber',
//         title: 'Phone Number',
//         restricted: true,
//     },
// ];

export default function PlayerList({
    players,
    managerId,
    managerView,
    handlePlayerListModal,
    handleAddPlayerModal,
    handlePlayerDetailsModal,
    primaryColor,
}) {

    // const [scrolled, setScrolled] = useState(false);

    // const headerClassName = scrolled ? styles.header + ' ' + styles.scrolled : styles.header;

    const handlePlayerCardClick = (playerId) => {
        handlePlayerDetailsModal(playerId);
    }

    return (
        <>
            <ScrollArea w="100%">
                {players.map(player => {
                    return (
                        <Card
                            key={player.$id}
                            mt="sm"
                            radius="md"
                            padding="sm"
                            withBorder
                            w={750}
                            onClick={() => handlePlayerCardClick(player.$id)}
                        >
                            <Flex wrap="nowrap" justify="space-between" align="center">
                                <Text size="lg">
                                    {player.firstName} {player.lastName}
                                </Text>
                                <Avatar.Group>
                                    {player?.preferredPositions?.map(position => (
                                        <Tooltip key={player.$id + position} label={position} withArrow>
                                            <Avatar name={positions[position].initials} alt={position} color="initials" />
                                        </Tooltip>
                                    ))}
                                </Avatar.Group>
                                {/* {getPlayerStatus(player)} */}
                                <Text>{player.$id === managerId ? 'Manager' : 'Player'}</Text>
                                {managerView && <Text>{player.email}</Text>}
                                {managerView && <Text>{player.phoneNumber}</Text>}
                            </Flex>
                        </Card>
                    )
                })}
            </ScrollArea>

            {managerView && (
                <Button
                    mt="sm"
                    color={primaryColor}
                    onClick={handleAddPlayerModal}
                    autoContrast
                    fullWidth
                >
                    <IconPlus size={20} />
                    Add Player
                </Button>
            )}
        </>
    );

    // return (
    //     <>
    //         <Card mt="sm" radius="md" padding="xs">
    //             <ScrollArea mah={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
    //                 <Table striped highlightOnHover>
    //                     <Table.Thead className={headerClassName}>
    //                         <Table.Tr>
    //                             {columns.map((column) => {
    //                                 const showColumn = !column.restricted || (column.restricted && managerView)
    //                                 return showColumn && (
    //                                     <Table.Th key={column.accessor} miw={100}>{column.title}</Table.Th>
    //                                 )
    //                             })}
    //                         </Table.Tr>
    //                     </Table.Thead>
    //                     <Table.Tbody>
    //                         {players.map((player) => {
    //                             const name = `${player.firstName} ${player.lastName}`;

    //                             return (
    //                                 <Table.Tr key={player.$id}>
    //                                     <Table.Td>{name}</Table.Td>
    //                                     <Table.Td>
    //                                         <Avatar.Group>
    //                                             {player?.preferredPositions?.map(position => (
    //                                                 <Tooltip key={player.$id + position} label={position} withArrow>
    //                                                     <Avatar name={positions[position].initials} alt={position} color="initials" />
    //                                                 </Tooltip>
    //                                             ))}
    //                                         </Avatar.Group>
    //                                     </Table.Td>
    //                                     <Table.Td>{player.$id === managerId ? 'Manager' : 'Player'}</Table.Td>
    //                                     {managerView && <Table.Td>{player.email}</Table.Td>}
    //                                     {managerView && <Table.Td>{player.phoneNumber}</Table.Td>}
    //                                 </Table.Tr>
    //                             )
    //                         })}
    //                     </Table.Tbody>
    //                 </Table>
    //             </ScrollArea>
    //         </Card>

    //         {managerView && (
    //             <Button
    //                 mt="md"
    //                 color={primaryColor}
    //                 onClick={handlePlayerListModal}
    //                 autoContrast
    //                 fullWidth
    //             >
    //                 <IconPlus size={20} />
    //                 Add Player
    //             </Button>
    //         )}
    //     </>
    // )
};