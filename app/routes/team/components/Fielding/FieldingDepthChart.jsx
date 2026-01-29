import { useState } from "react";

import {
    Avatar,
    ActionIcon,
    Button,
    Card,
    Checkbox,
    Divider,
    Group,
    Stack,
    Text,
    Title,
    useMantineTheme,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { useDisclosure } from "@mantine/hooks";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";

import {
    IconPlus,
    IconTrash,
    IconGripVertical,
    IconLock,
    IconLockOpen,
} from "@tabler/icons-react";

import fieldingPositions from "@/constants/positions";
import DrawerContainer from "@/components/DrawerContainer";

import classes from "./FieldingDepthChart.module.css";

// Simple player selector specifically for this use case
const PlayerSelector = ({ players, onSelect, onClose }) => {
    const [selected, setSelected] = useState([]);

    const handleSubmit = () => {
        onSelect(selected);
        onClose();
    };

    // Sort players alphabetically
    const sortedPlayers = [...players].sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(
            `${b.lastName} ${b.firstName}`,
        ),
    );

    return (
        <Stack>
            <Checkbox.Group value={selected} onChange={setSelected}>
                <Stack>
                    {sortedPlayers.map((p) => (
                        <Card key={p.$id} p="xs" withBorder>
                            <Checkbox
                                value={p.$id}
                                label={`${p.firstName} ${p.lastName}`}
                                style={{ cursor: "pointer" }}
                            />
                        </Card>
                    ))}
                </Stack>
            </Checkbox.Group>
            <Button onClick={handleSubmit} disabled={selected.length === 0}>
                Add Selected
            </Button>
        </Stack>
    );
};

// Extracted component for draggable player items to reduce nesting
const DraggablePlayerItem = ({
    player,
    provided,
    snapshot,
    managerView,
    onRemove,
    onToggleNeverSub,
    neverSub,
    canToggleLock,
    showDivider,
    theme,
}) => (
    <Card
        p="xs"
        radius="md"
        ref={provided.innerRef}
        {...provided.draggableProps}
        style={{
            ...provided.draggableProps.style,
            borderColor: snapshot.isDragging ? theme.colors.blue[6] : undefined,
        }}
    >
        <Group justify="space-between" wrap="nowrap">
            <Group gap="sm">
                {managerView && (
                    <div
                        {...provided.dragHandleProps}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "grab",
                        }}
                    >
                        <IconGripVertical size={16} color="gray" />
                    </div>
                )}
                <Avatar
                    radius="xl"
                    size="sm"
                    color="initials"
                    name={`${player.firstName} ${player.lastName}`}
                />
                <Text size="sm">
                    {player.firstName} {player.lastName}
                </Text>
            </Group>

            <Group gap={4}>
                {managerView
                    ? (neverSub || canToggleLock) && (
                          <ActionIcon
                              variant={neverSub ? "light" : "subtle"}
                              color={neverSub ? "blue" : "gray"}
                              onClick={() => onToggleNeverSub(!neverSub)}
                              size="md"
                          >
                              {neverSub ? (
                                  <IconLock size={18} />
                              ) : (
                                  <IconLockOpen size={18} />
                              )}
                          </ActionIcon>
                      )
                    : neverSub && (
                          <IconLock
                              size={16}
                              color="var(--mantine-color-blue-6)"
                          />
                      )}

                {managerView && (
                    <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={onRemove}
                        aria-label="Remove player from position"
                        size="md"
                    >
                        <IconTrash size={18} />
                    </ActionIcon>
                )}
            </Group>
        </Group>
        {showDivider && <Divider mt="xs" />}
    </Card>
);

export default function FieldingDepthChart({
    positioning,
    players,
    handlePositionUpdate,
    managerView,
}) {
    const theme = useMantineTheme();
    const positions = Object.keys(fieldingPositions);

    // State to track active slide
    const [activeSlide, setActiveSlide] = useState(0);
    const activePosition = positions[activeSlide];

    // State for add player drawer
    const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
        useDisclosure(false);

    // Helper to normalize data structure (handles migration from array of strings to array of objects)
    const getNormalizedList = (position) => {
        const list = positioning[position] || [];
        return list.map((item) => {
            if (typeof item === "string") {
                return { id: item, neverSub: false };
            }
            return item;
        });
    };

    const handleAddPlayers = (playerIds) => {
        if (!activePosition) return;

        const currentList = getNormalizedList(activePosition);
        const currentIds = currentList.map((i) => i.id);

        // Avoid duplicates
        const newIds = playerIds.filter((id) => !currentIds.includes(id));

        if (newIds.length > 0) {
            const newItems = newIds.map((id) => ({ id, neverSub: false }));
            handlePositionUpdate(activePosition, [...currentList, ...newItems]);
        }
    };

    const handleRemovePlayer = (position, playerId) => {
        const currentList = getNormalizedList(position);
        const newList = currentList.filter((item) => item.id !== playerId);
        handlePositionUpdate(position, newList);
    };

    const handleToggleNeverSub = (position, playerId, value) => {
        const currentList = getNormalizedList(position);
        const newList = currentList.map((item) =>
            item.id === playerId ? { ...item, neverSub: value } : item,
        );
        handlePositionUpdate(position, newList);
    };

    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination) return;
        if (source.index === destination.index) return;

        const currentList = [...getNormalizedList(activePosition)];
        const [moved] = currentList.splice(source.index, 1);
        currentList.splice(destination.index, 0, moved);

        handlePositionUpdate(activePosition, currentList);
    };

    // Helper to get player details
    const getPlayer = (id) => players.find((p) => p.$id === id);

    // Get active position details
    const activeAssignedPlayerObjects = getNormalizedList(activePosition);

    // Check if any player is locked in this position
    const lockedPlayerId = activeAssignedPlayerObjects.find(
        (p) => p.neverSub,
    )?.id;

    return (
        <Stack>
            {/* Position Selector Carousel */}
            <Carousel
                slideSize="80%"
                slideGap="md"
                withIndicators
                withControls={false}
                height={120}
                onSlideChange={setActiveSlide}
                classNames={{
                    indicator: classes.indicator,
                }}
                emblaOptions={{
                    loop: true,
                    dragFree: false,
                    align: "center",
                }}
                mt="lg"
                pb="sm"
            >
                {positions.map((position) => {
                    const count = (positioning[position] || []).length;
                    return (
                        <Carousel.Slide key={position}>
                            <Card
                                shadow="sm"
                                radius="lg"
                                withBorder
                                display="flex"
                                style={{
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                <Stack align="center" gap="xs">
                                    <Title order={3} ta="center">
                                        {position}
                                    </Title>
                                    <Text size="sm" c="dimmed">
                                        {count === 0
                                            ? "No players"
                                            : `${count} Player${count !== 1 ? "s" : ""}`}
                                    </Text>
                                </Stack>
                            </Card>
                        </Carousel.Slide>
                    );
                })}
            </Carousel>

            {/* Active Position Depth Chart */}
            <Stack mt="lg">
                <Title order={4} ta="center">
                    Depth Chart
                </Title>

                {activeAssignedPlayerObjects.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        No players assigned to this position.
                    </Text>
                ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId={`droppable-${activePosition}`}>
                            {(provided) => (
                                <Card withBorder radius="lg" p="xs">
                                    <Stack
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        gap={0}
                                    >
                                        {activeAssignedPlayerObjects.map(
                                            (item, index) => {
                                                const player = getPlayer(
                                                    item.id,
                                                );
                                                if (!player) return null;

                                                const canToggleLock =
                                                    !lockedPlayerId ||
                                                    lockedPlayerId === item.id;

                                                return (
                                                    <Draggable
                                                        key={item.id}
                                                        draggableId={item.id}
                                                        index={index}
                                                        isDragDisabled={
                                                            !managerView
                                                        }
                                                    >
                                                        {(
                                                            provided,
                                                            snapshot,
                                                        ) => (
                                                            <DraggablePlayerItem
                                                                player={player}
                                                                provided={
                                                                    provided
                                                                }
                                                                snapshot={
                                                                    snapshot
                                                                }
                                                                managerView={
                                                                    managerView
                                                                }
                                                                onRemove={() =>
                                                                    handleRemovePlayer(
                                                                        activePosition,
                                                                        item.id,
                                                                    )
                                                                }
                                                                neverSub={
                                                                    item.neverSub
                                                                }
                                                                canToggleLock={
                                                                    canToggleLock
                                                                }
                                                                onToggleNeverSub={(
                                                                    val,
                                                                ) =>
                                                                    handleToggleNeverSub(
                                                                        activePosition,
                                                                        item.id,
                                                                        val,
                                                                    )
                                                                }
                                                                showDivider={
                                                                    index <
                                                                    activeAssignedPlayerObjects.length -
                                                                        1
                                                                }
                                                                theme={theme}
                                                            />
                                                        )}
                                                    </Draggable>
                                                );
                                            },
                                        )}
                                        {provided.placeholder}
                                    </Stack>
                                </Card>
                            )}
                        </Droppable>
                    </DragDropContext>
                )}

                {managerView && (
                    <Button
                        variant="light"
                        leftSection={<IconPlus size={16} />}
                        onClick={openDrawer}
                        fullWidth
                        mt="sm"
                    >
                        Add Player
                    </Button>
                )}
            </Stack>

            <DrawerContainer
                opened={drawerOpened}
                onClose={closeDrawer}
                title={`Add Players to ${activePosition}`}
                size="md"
            >
                <PlayerSelector
                    players={players}
                    onSelect={handleAddPlayers}
                    onClose={closeDrawer}
                />
            </DrawerContainer>
        </Stack>
    );
}
