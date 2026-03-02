import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Card, Divider, Grid, Group, Stack, Text, Title } from "@mantine/core";
import { IconGripVertical, IconGenderFemale } from "@tabler/icons-react";

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

function DraggableBatterRow({
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
                            ? "var(--mantine-color-lime-5)"
                            : undefined,
                        boxShadow: snapshot.isDragging
                            ? "0 8px 24px rgba(0,0,0,0.25)"
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
                                    alignItems: "center",
                                }}
                            >
                                <IconGripVertical size={16} color="gray" />
                            </div>
                        )}
                        {showNumber && (
                            <Text fw={700} w={28} c="dimmed" size="sm">
                                {index + 1}.
                            </Text>
                        )}
                        <Text size="sm" style={{ flex: 1 }}>
                            {player.firstName} {player.lastName}
                        </Text>
                        <Group gap="xs" ml="auto" wrap="nowrap">
                            {player.gender === "Female" && (
                                <IconGenderFemale
                                    size={16}
                                    color="var(--mantine-color-pink-5)"
                                />
                            )}
                            {player.bats && (
                                <Text
                                    size="xs"
                                    c={getBatsColor(player.bats)}
                                    fw={600}
                                    tt="uppercase"
                                >
                                    {player.bats[0]}
                                </Text>
                            )}
                        </Group>
                    </Group>
                    {!isLast && <Divider mt="xs" />}
                </Card>
            )}
        </Draggable>
    );
}

function BattingList({
    listId,
    items,
    title,
    showNumber,
    playerMap,
    managerView,
}) {
    return (
        <Droppable droppableId={listId}>
            {(provided, snapshot) => (
                <Card
                    withBorder
                    radius="lg"
                    p="xs"
                    h="100%"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        borderColor: snapshot.isDraggingOver
                            ? "var(--mantine-color-lime-5)"
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
                        style={{ flex: 1, minHeight: 60 }}
                    >
                        {items.length === 0 && (
                            <Text c="dimmed" size="sm" ta="center" py="lg">
                                Drag players here
                            </Text>
                        )}
                        {items.map((playerId, index) => {
                            const player = playerMap[playerId];
                            if (!player) return null;
                            return (
                                <DraggableBatterRow
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
}

export default function DesktopBattingEditor({
    lineup,
    reserves,
    players,
    handleReorder,
    managerView,
}) {
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

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Grid gutter="lg" style={{ alignItems: "stretch" }}>
                <Grid.Col
                    span={6}
                    style={{ display: "flex", flexDirection: "column" }}
                >
                    <BattingList
                        listId="lineup"
                        items={lineup}
                        title="Lineup"
                        showNumber={true}
                        playerMap={playerMap}
                        managerView={managerView}
                    />
                </Grid.Col>
                <Grid.Col
                    span={6}
                    style={{ display: "flex", flexDirection: "column" }}
                >
                    <BattingList
                        listId="reserves"
                        items={reserves}
                        title="Reserves"
                        showNumber={false}
                        playerMap={playerMap}
                        managerView={managerView}
                    />
                </Grid.Col>
            </Grid>
        </DragDropContext>
    );
}
