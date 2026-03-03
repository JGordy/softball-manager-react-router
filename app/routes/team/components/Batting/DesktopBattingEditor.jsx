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
    numberOffset = 0,
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
                                {numberOffset + index + 1}.
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
                    style={{
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

// Helper: resolve a droppable ID to "lineup" or "reserves"
const resolveListId = (droppableId) => {
    if (droppableId === "lineup-col-1" || droppableId === "lineup-col-2")
        return "lineup";
    return droppableId; // "reserves"
};

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

    // Split lineup into two visual columns
    const half = Math.ceil(lineup.length / 2);
    const col1 = lineup.slice(0, half);
    const col2 = lineup.slice(half);

    const onDragEnd = ({ source, destination }) => {
        if (!destination) return;
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        )
            return;

        const srcList = resolveListId(source.droppableId);
        const destList = resolveListId(destination.droppableId);

        // Convert column-local index to a flat lineup index
        const toFlatIndex = (droppableId, index) => {
            if (droppableId === "lineup-col-2") return half + index;
            return index; // col-1 or reserves (reserves index is irrelevant here)
        };

        handleReorder({
            source: {
                droppableId: srcList,
                index:
                    srcList === "lineup"
                        ? toFlatIndex(source.droppableId, source.index)
                        : source.index,
            },
            destination: {
                droppableId: destList,
                index:
                    destList === "lineup"
                        ? toFlatIndex(
                              destination.droppableId,
                              destination.index,
                          )
                        : destination.index,
            },
        });
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Grid gutter="lg">
                {/* Lineup card — two internal droppable columns */}
                <Grid.Col span={8}>
                    <Card
                        withBorder
                        radius="lg"
                        p="xs"
                        style={{ display: "flex", flexDirection: "column" }}
                    >
                        <Title order={5} mb="xs" px="xs">
                            Lineup
                        </Title>
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                flex: 1,
                                alignItems: "flex-start",
                            }}
                        >
                            {/* Left column */}
                            <Droppable droppableId="lineup-col-1">
                                {(provided1, snapshot1) => (
                                    <Stack
                                        gap={0}
                                        {...provided1.droppableProps}
                                        ref={provided1.innerRef}
                                        style={{
                                            flex: 1,
                                            minHeight: 60,
                                            borderRadius: 8,
                                            transition: "background 0.2s ease",
                                            background: snapshot1.isDraggingOver
                                                ? "rgba(163,230,53,0.06)"
                                                : undefined,
                                        }}
                                    >
                                        {col1.length === 0 && (
                                            <Text
                                                c="dimmed"
                                                size="sm"
                                                ta="center"
                                                py="lg"
                                            >
                                                Drag players here
                                            </Text>
                                        )}
                                        {col1.map((playerId, index) => {
                                            const player = playerMap[playerId];
                                            if (!player) return null;
                                            return (
                                                <DraggableBatterRow
                                                    key={playerId}
                                                    playerId={playerId}
                                                    player={player}
                                                    index={index}
                                                    managerView={managerView}
                                                    isLast={
                                                        index ===
                                                        col1.length - 1
                                                    }
                                                    showNumber={true}
                                                />
                                            );
                                        })}
                                        {provided1.placeholder}
                                    </Stack>
                                )}
                            </Droppable>

                            {/* Divider between columns */}
                            <div
                                style={{
                                    width: 1,
                                    alignSelf: "stretch",
                                    background: "var(--mantine-color-dark-4)",
                                    flexShrink: 0,
                                }}
                            />

                            {/* Right column */}
                            <Droppable droppableId="lineup-col-2">
                                {(provided2, snapshot2) => (
                                    <Stack
                                        gap={0}
                                        {...provided2.droppableProps}
                                        ref={provided2.innerRef}
                                        style={{
                                            flex: 1,
                                            minHeight: 60,
                                            borderRadius: 8,
                                            transition: "background 0.2s ease",
                                            background: snapshot2.isDraggingOver
                                                ? "rgba(163,230,53,0.06)"
                                                : undefined,
                                        }}
                                    >
                                        {col2.length === 0 && (
                                            <Text
                                                c="dimmed"
                                                size="sm"
                                                ta="center"
                                                py="lg"
                                            >
                                                Drag players here
                                            </Text>
                                        )}
                                        {col2.map((playerId, index) => {
                                            const player = playerMap[playerId];
                                            if (!player) return null;
                                            return (
                                                <DraggableBatterRow
                                                    key={playerId}
                                                    playerId={playerId}
                                                    player={player}
                                                    index={index}
                                                    managerView={managerView}
                                                    isLast={
                                                        index ===
                                                        col2.length - 1
                                                    }
                                                    showNumber={true}
                                                    numberOffset={half}
                                                />
                                            );
                                        })}
                                        {provided2.placeholder}
                                    </Stack>
                                )}
                            </Droppable>
                        </div>
                    </Card>
                </Grid.Col>

                {/* Reserves column */}
                <Grid.Col span={4}>
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
