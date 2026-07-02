import React, { useCallback } from "react";
import { Group, Select, Text } from "@mantine/core";

import styles from "@/components/PlayerChart/PlayerChart.module.css";

const PositionSelect = React.memo(
    ({
        row,
        inning,
        handlePositionChange,
        positionData,
        playerLookup,
        error,
        id,
    }) => {
        const renderSelectOption = useCallback(
            ({ option }) => {
                const player = playerLookup[row.playerId];

                let color = "gray";

                const preferredPositions = player?.preferredPositions;
                if (preferredPositions?.includes(option.value)) {
                    color = "lime";
                }

                const dislikedPositions = player?.dislikedPositions;
                if (dislikedPositions?.includes(option.value)) {
                    color = "red";
                }

                if (option.value === "Out") {
                    color = "yellow";
                }

                return (
                    <Group gap="xs">
                        <Text c={color}>{option.label}</Text>
                    </Group>
                );
            },
            [playerLookup, row.playerId],
        );

        return (
            <Select
                id={id}
                key={`${row.player}-${inning}`}
                value={row[inning]}
                onChange={(event) =>
                    handlePositionChange(event, row.playerId, inning)
                }
                data={positionData}
                style={{ minWidth: "inherit" }}
                className={styles.positionSelect}
                renderOption={renderSelectOption}
                error={error}
                comboboxProps={{
                    width: "max-content",
                    withinPortal: true,
                    zIndex: 10000,
                }}
            />
        );
    },
);

PositionSelect.displayName = "PositionSelect";

export default PositionSelect;
