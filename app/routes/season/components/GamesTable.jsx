import { Card, ScrollArea, Table } from '@mantine/core';

export default function GamesTable({ games, columns, variant = '', striped = false }) {
    const defaultColumns = ['date', 'time']; // Separate columns for date and time
    const otherColumns = columns ? columns.filter(col => !defaultColumns.includes(col)) : []; // Filter out default columns
    const allColumns = [...defaultColumns, ...otherColumns]; // Combine default and other columns

    const headers = allColumns.map((column) => {
        let headerText = column;

        if (column === 'date') headerText = 'Date';
        else if (column === 'time') headerText = 'Time';
        else if (column === 'opponentScore') headerText = "Opponent Score";
        else headerText = column.charAt(0).toUpperCase() + column.slice(1);
        // ... more custom header text mappings

        return <Table.Th key={column} miw={100}>{headerText}</Table.Th>;
    });

    const rows = games.map((game, index) => (
        <Table.Tr key={index}>
            {allColumns.map((column) => {
                let cellValue;

                if (column === 'date') {
                    cellValue = new Date(game.gameDate).toLocaleDateString();
                } else if (column === 'time') {
                    cellValue = new Date(game.gameDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format time
                } else {
                    cellValue = game[column]; // Other columns
                }

                return <Table.Td key={column}>{cellValue}</Table.Td>;
            })}
        </Table.Tr>
    ));

    return (
        <Card withBorder>
            <ScrollArea maw={'100vw'} h={'50vh'}>
                <Table
                    layout={variant}
                    striped={striped}
                    withColumnBorders
                >
                    <Table.Thead>
                        <Table.Tr>{headers}</Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </ScrollArea>
        </Card>
    );
}