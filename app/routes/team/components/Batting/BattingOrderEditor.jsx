import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Badge, Card, Divider, Group, Stack, Text, Title } from "@mantine/core";
import { IconGenderFemale, IconGripVertical } from "@tabler/icons-react";

// Helper to get badge color based on batting handedness
const getBatsColor = (bats) => {
    switch (bats) {
        case "Left":
            return "lime";
        case "Right":
            return "blue";
        case "Switch":
            return "orange";
        default:
            return "gray";
    }
};

// Drag handle component
function DragHandle({ dragHandleProps }) {
    return (
        <div
            {...dragHandleProps}
            style={{
                cursor: "grab",
                display: "flex",
                alignItems: "center",
            }}
        >
            <IconGripVertical size={18} color="gray" />
        </div>
    );
}

// Player info badges (gender icon + bats badge)
function PlayerBadges({ player }) {
    return (
        <Group gap="xs" ml="auto" wrap="nowrap">
            {player.gender === "Female" && (
                <IconGenderFemale
                    size={18}
                    color="var(--mantine-color-pink-5)"
                />
            )}
            {player.bats && (
                <Badge
                    size="sm"
                    variant="light"
                    color={getBatsColor(player.bats)}
                >
                    Bats: {player.bats}
                </Badge>
            )}
        </Group>
    );
}

// Individual draggable player row
function DraggablePlayerRow({
    playerId,
    player,
    index,
    managerView,
    isLast,
    showNumber,
}) {
    return (
        <Draggable
            key={playerId}
            draggableId={playerId}
            index={index}
            isDragDisabled={!managerView}
        >
            {(provided, snapshot) => (
                <Card
                    padding="xs"
                    radius="md"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={{
                        ...provided.draggableProps.style,
                        borderColor: snapshot.isDragging
                            ? "var(--mantine-color-blue-filled)"
                            : undefined,
                    }}
                >
                    <Group wrap="nowrap">
                        {managerView && (
                            <DragHandle
                                dragHandleProps={provided.dragHandleProps}
                            />
                        )}
                        {showNumber && (
                            <Text fw={700} w={30}>
                                {index + 1}.
                            </Text>
                        )}
                        <Text size="sm">
                            {player.firstName} {player.lastName}
                        </Text>
                        <PlayerBadges player={player} />
                    </Group>
                    {!isLast && <Divider mt="xs" />}
                </Card>
            )}
        </Draggable>
    );
}

export default function BattingOrderEditor({
    lineup,
    reserves = [],
    players,
    handleReorder,
    managerView,
}) {
    // Map of playerId -> player object
    const playerMap = players.reduce((acc, p) => {
        acc[p.$id] = p;
        return acc;
    }, {});

    const onDragEnd = ({ source, destination }) => {
        if (!destination) return;
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        )
            return;

        handleReorder({ source, destination });
    };

    const renderList = (listId, items, title, showNumber) => (
        <Droppable droppableId={listId}>
            {(provided, snapshot) => (
                <Card
                    withBorder
                    mt="md"
                    radius="lg"
                    p="xs"
                    style={{
                        borderColor: snapshot.isDraggingOver
                            ? "var(--mantine-color-blue-filled)"
                            : undefined,
                        transition: "border-color 0.2s ease",
                    }}
                >
                    <Title order={5} mb="xs" px="xs">
                        {title}
                    </Title>
                    <Stack
                        gap={0}
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        mih={items.length === 0 ? 50 : 0}
                    >
                        {items.length === 0 && (
                            <Text c="dimmed" size="sm" ta="center" py="sm">
                                No players
                            </Text>
                        )}
                        {items.map((playerId, index) => {
                            const player = playerMap[playerId];
                            if (!player) return null;

                            return (
                                <DraggablePlayerRow
                                    key={playerId}
                                    playerId={playerId}
                                    player={player}
                                    index={index}
                                    managerView={managerView}
                                    isLast={index === items.length - 1}
                                    showNumber={showNumber}
                                />
                            );
                        })}
                        {provided.placeholder}
                    </Stack>
                </Card>
            )}
        </Droppable>
    );

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            {renderList("lineup", lineup, "Batting Order", true)}
            {renderList("reserves", reserves, "Reserves", false)}
        </DragDropContext>
    );
}
