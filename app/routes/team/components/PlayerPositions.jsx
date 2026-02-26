import { Avatar, Tooltip } from "@mantine/core";
import positions from "@/constants/positions";

export default function PlayerPositions({ preferredPositions, playerId }) {
    const positionCount = preferredPositions?.length || 0;
    const maxVisible = 4;
    const hasOverflow = positionCount > maxVisible;
    const displayCount = hasOverflow ? maxVisible - 1 : maxVisible;
    const visiblePositions = preferredPositions?.slice(0, displayCount) || [];
    const overflowCount = positionCount - displayCount;

    return (
        <Avatar.Group>
            {visiblePositions.map((position) => (
                <Tooltip key={playerId + position} label={position} withArrow>
                    <Avatar
                        name={positions[position].initials}
                        alt={position}
                        color="initials"
                        size="sm"
                    />
                </Tooltip>
            ))}
            {hasOverflow && <Avatar size="sm">+{overflowCount}</Avatar>}
        </Avatar.Group>
    );
}
