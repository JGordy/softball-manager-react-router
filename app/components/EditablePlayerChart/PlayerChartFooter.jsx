import React from "react";
import { Avatar, Table, Text, Tooltip } from "@mantine/core";
import fieldingPositions from "@/constants/positions";
import styles from "../../styles/playerChart.module.css";

const PlayerChartFooter = ({ managerView, fieldingErrors }) => {
    return (
        <Table.Tfoot className={styles.footer}>
            <Table.Tr className={styles.footerRow}>
                {managerView && <Table.Th />}
                <Table.Th />
                <Table.Th className={styles.footerCell} pt="md">
                    Missing Positions
                </Table.Th>
                {Array.from({ length: 7 }, (_, i) => {
                    const inningKey = `inning${i + 1}`;
                    const missing = fieldingErrors?.[inningKey]?.missing || [];

                    return (
                        <Table.Th key={inningKey} className={styles.footerCell}>
                            {missing.length > 0 && (
                                <Avatar.Group>
                                    {missing.map((pos) => {
                                        const initials =
                                            fieldingPositions[pos]?.initials ||
                                            pos;
                                        return (
                                            <Tooltip
                                                key={pos}
                                                label={pos}
                                                withArrow
                                            >
                                                <Avatar
                                                    color="red"
                                                    radius="xl"
                                                    size="md"
                                                >
                                                    {initials}
                                                </Avatar>
                                            </Tooltip>
                                        );
                                    })}
                                </Avatar.Group>
                            )}
                        </Table.Th>
                    );
                })}
            </Table.Tr>
        </Table.Tfoot>
    );
};

export default PlayerChartFooter;
