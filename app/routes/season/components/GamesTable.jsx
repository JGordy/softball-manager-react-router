import { Table } from '@mantine/core';

export default function GamesTable({ games }) {
    const rows = games.map((game, index) => (
        <Table.Tr key={index}>
            <Table.Td>{new Date(game.gameDate).toLocaleDateString()}</Table.Td>
            <Table.Td>{new Date(game.gameDate).toLocaleTimeString()}</Table.Td>
        </Table.Tr>
    ));

    return (
        <Table>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Time</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
        </Table>
    );
}