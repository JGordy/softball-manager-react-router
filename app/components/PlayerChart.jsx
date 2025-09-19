import { useMemo } from "react";

import { ScrollArea, Table, Text } from "@mantine/core";

import fieldingPositions from "@/constants/positions";

import styles from "../styles/playerChart.module.css";

const PlayerChart = ({ playerChart }) => {
    const columns = useMemo(
        () => [
            {
                accessor: "battingOrder",
                title: "",
            },
            {
                accessor: "player",
                title: "Player",
            },
            ...Array.from({ length: 7 }, (_, i) => ({
                accessor: `inning${i + 1}`,
                title: `${i + 1}`,
            })),
        ],
        [],
    );

    const rows = useMemo(() => {
        return playerChart.map((player, index) => {
            const row = {
                battingOrder: index + 1,
                playerId: player.$id,
                player: `${player.firstName} ${player.lastName.charAt(0)}.`,
            };
            player.positions.forEach((position, i) => {
                row[`inning${i + 1}`] = position || "Out";
            });
            return row;
        });
    }, [playerChart]);

    if (!playerChart) {
        return null;
    }

    return (
        <div className={styles.tableContainer}>
            <ScrollArea.Autosize
                miw={650}
                mah={450}
                scrollbars={false}
                offsetScrollbars
            >
                <Table stickyHeader withTableBorder withColumnBorders striped>
                    <Table.Thead className={styles.header}>
                        <Table.Tr>
                            {columns.map((column) => (
                                <Table.Th key={column.accessor}>
                                    {column.title}
                                </Table.Th>
                            ))}
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {rows.map((row) => (
                            <Table.Tr key={row.playerId}>
                                {columns.map((column) => {
                                    if (column.accessor.startsWith("inning")) {
                                        const position = row[column.accessor];
                                        let label = "Out";
                                        if (position !== "Out")
                                            label =
                                                fieldingPositions[position]
                                                    .initials;

                                        return (
                                            <Table.Td key={column.accessor}>
                                                {label}
                                            </Table.Td>
                                        );
                                    } else {
                                        return (
                                            <Table.Td key={column.accessor}>
                                                {row[column.accessor]}
                                            </Table.Td>
                                        );
                                    }
                                })}
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea.Autosize>
        </div>
    );
};

export default PlayerChart;
