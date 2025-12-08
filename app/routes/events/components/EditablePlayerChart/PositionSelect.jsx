import React, { useCallback } from "react";
import { Group, Select, Text } from "@mantine/core";

const PositionSelect = React.memo(
    ({
        row,
        inning,
        handlePositionChange,
        positionData,
        playerLookup,
        error,
    }) => {
        const renderSelectOption = useCallback(
            ({ option }) => {
                const player = playerLookup[row.playerId];

                let color = "gray";

                const preferredPositions = player?.preferredPositions;
                if (preferredPositions?.includes(option.value)) {
                    color = "green";
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
                key={`${row.player}-${inning}`}
                value={row[inning]}
                onChange={(event) =>
                    handlePositionChange(event, row.playerId, inning)
                }
                data={positionData}
                style={{ minWidth: "160px" }}
                renderOption={renderSelectOption}
                error={error}
            />
        );
    },
);

export default PositionSelect;
