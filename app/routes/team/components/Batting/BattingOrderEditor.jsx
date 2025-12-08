import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Avatar, Card, Divider, Group, Stack, Text } from "@mantine/core";
import { IconGripVertical } from "@tabler/icons-react";

export default function BattingOrderEditor({
    lineup,
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
        if (source.index === destination.index) return;

        handleReorder({
            from: source.index,
            to: destination.index,
        });
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="batting-order">
                {(provided) => (
                    <Card withBorder mt="lg" radius="lg" p="xs">
                        <Stack
                            gap={0}
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            {lineup.map((playerId, index) => {
                                const player = playerMap[playerId];
                                if (!player) return null;

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
                                                    ...provided.draggableProps
                                                        .style,
                                                    borderColor:
                                                        snapshot.isDragging
                                                            ? "var(--mantine-color-blue-filled)"
                                                            : undefined,
                                                }}
                                            >
                                                <Group wrap="nowrap">
                                                    {managerView && (
                                                        <div
                                                            {...provided.dragHandleProps}
                                                            style={{
                                                                cursor: "grab",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                            }}
                                                        >
                                                            <IconGripVertical
                                                                size={18}
                                                                color="gray"
                                                            />
                                                        </div>
                                                    )}
                                                    <Text fw={700} w={30}>
                                                        {index + 1}.
                                                    </Text>
                                                    <Avatar
                                                        name={`${player.firstName} ${player.lastName}`}
                                                        radius="xl"
                                                        size="sm"
                                                        color="initials"
                                                    />
                                                    <Text size="sm">
                                                        {player.firstName}{" "}
                                                        {player.lastName}
                                                    </Text>
                                                </Group>
                                                {index < lineup.length - 1 && (
                                                    <Divider mt="xs" />
                                                )}
                                            </Card>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </Stack>
                    </Card>
                )}
            </Droppable>
        </DragDropContext>
    );
}
