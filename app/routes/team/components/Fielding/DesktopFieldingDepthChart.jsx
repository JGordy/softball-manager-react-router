import { useState } from "react";

import {
    Avatar,
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Checkbox,
    Divider,
    Grid,
    Group,
    Image,
    Stack,
    Text,
    Title,
    Tooltip,
    useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
    IconPlus,
    IconTrash,
    IconGripVertical,
    IconLock,
    IconLockOpen,
} from "@tabler/icons-react";

import images from "@/constants/images";
import fieldingPositions from "@/constants/positions";
import DrawerContainer from "@/components/DrawerContainer";

import styles from "../DesktopLineupContainer.module.css";

// ─── Position coordinates on the field image (x%, y%) ───────────────
// Home plate is at approximately (50%, 78%) in the field image.
const POSITION_COORDS = {
    Pitcher: { x: 50, y: 62 },
    Catcher: { x: 50, y: 80 },
    "First Base": { x: 67, y: 58 },
    "Second Base": { x: 58, y: 48 },
    "Third Base": { x: 33, y: 58 },
    Shortstop: { x: 42, y: 48 },
    "Left Field": { x: 25, y: 35 },
    "Left Center Field": { x: 40, y: 25 },
    "Right Center Field": { x: 60, y: 25 },
    "Right Field": { x: 75, y: 35 },
};

// ─── Player selector (drawer content) ────────────────────────────────

function PlayerSelector({ players, onSelect, onClose, activePosition }) {
    const [selected, setSelected] = useState([]);

    const handleSubmit = () => {
        onSelect(selected);
        onClose();
    };

    const getPreference = (player) => {
        if (player.preferredPositions?.includes(activePosition))
            return "preferred";
        if (player.dislikedPositions?.includes(activePosition))
            return "disliked";
        return "neutral";
    };

    const preferenceOrder = { preferred: 0, neutral: 1, disliked: 2 };

    const sortedPlayers = [...players].sort((a, b) => {
        const prefDiff =
            preferenceOrder[getPreference(a)] -
            preferenceOrder[getPreference(b)];
        if (prefDiff !== 0) return prefDiff;
        return `${a.lastName} ${a.firstName}`.localeCompare(
            `${b.lastName} ${b.firstName}`,
        );
    });

    return (
        <Stack>
            <Checkbox.Group value={selected} onChange={setSelected}>
                <Stack>
                    {sortedPlayers.map((p) => {
                        const pref = getPreference(p);
                        return (
                            <Card
                                key={p.$id}
                                p="xs"
                                withBorder
                                style={{
                                    borderColor:
                                        pref === "preferred"
                                            ? "var(--mantine-color-lime-6)"
                                            : pref === "disliked"
                                              ? "var(--mantine-color-orange-6)"
                                              : undefined,
                                }}
                            >
                                <Group justify="space-between" wrap="nowrap">
                                    <Checkbox
                                        value={p.$id}
                                        label={`${p.firstName} ${p.lastName}`}
                                        style={{ cursor: "pointer" }}
                                    />
                                    {pref === "preferred" && (
                                        <Badge
                                            color="lime"
                                            variant="light"
                                            size="xs"
                                        >
                                            Preferred
                                        </Badge>
                                    )}
                                    {pref === "disliked" && (
                                        <Badge
                                            color="orange"
                                            variant="light"
                                            size="xs"
                                        >
                                            Dislikes
                                        </Badge>
                                    )}
                                </Group>
                            </Card>
                        );
                    })}
                </Stack>
            </Checkbox.Group>
            <Button
                onClick={handleSubmit}
                disabled={selected.length === 0}
                color="lime"
            >
                Add Selected
            </Button>
        </Stack>
    );
}

// ─── Clickable position hotspot on the field image ────────────────────

function PositionHotspot({
    position,
    coords,
    isSelected,
    assignedCount,
    onClick,
}) {
    const initials = fieldingPositions[position]?.initials || position;

    return (
        <Tooltip label={position} withArrow position="top">
            <Box
                className={`${styles.hotspot} ${isSelected ? styles.hotspotSelected : ""}`}
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                onClick={() => onClick(position)}
                role="button"
                tabIndex={0}
                aria-label={`Select ${position}`}
                onKeyDown={(e) => e.key === "Enter" && onClick(position)}
            >
                <Text size="xs" fw={800} lh={1}>
                    {initials}
                </Text>
                {assignedCount > 0 && (
                    <Box className={styles.hotspotBadge}>{assignedCount}</Box>
                )}
            </Box>
        </Tooltip>
    );
}

// ─── Draggable player row in the depth chart ──────────────────────────

function DraggableFielderItem({
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
}) {
    return (
        <Card
            p="xs"
            radius="md"
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={{
                ...provided.draggableProps.style,
                borderColor: snapshot.isDragging
                    ? theme.colors.lime[5]
                    : undefined,
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
                                  aria-label={
                                      neverSub
                                          ? "Unlock player"
                                          : "Lock player (Never Sub)"
                                  }
                              >
                                  {neverSub ? (
                                      <IconLock size={16} />
                                  ) : (
                                      <IconLockOpen size={16} />
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
                            <IconTrash size={16} />
                        </ActionIcon>
                    )}
                </Group>
            </Group>
            {showDivider && <Divider mt="xs" />}
        </Card>
    );
}

// ─── Droppable player list ───────────────────────────────────────────

function FielderDragList({
    activeList,
    activePosition,
    lockedPlayerId,
    managerView,
    getPlayer,
    onRemove,
    onToggleNeverSub,
    theme,
}) {
    return (
        <Droppable droppableId={`fielding-${activePosition}`}>
            {(provided) => (
                <Card withBorder radius="lg" p="xs">
                    <Stack
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        gap={0}
                    >
                        {activeList.map((item, index) => {
                            const player = getPlayer(item.id);
                            if (!player) return null;
                            const canToggleLock =
                                !lockedPlayerId || lockedPlayerId === item.id;

                            return (
                                <Draggable
                                    key={item.id}
                                    draggableId={item.id}
                                    index={index}
                                    isDragDisabled={!managerView}
                                >
                                    {(provided, snapshot) => (
                                        <DraggableFielderItem
                                            player={player}
                                            provided={provided}
                                            snapshot={snapshot}
                                            managerView={managerView}
                                            onRemove={() => onRemove(item.id)}
                                            neverSub={item.neverSub}
                                            canToggleLock={canToggleLock}
                                            onToggleNeverSub={(val) =>
                                                onToggleNeverSub(item.id, val)
                                            }
                                            showDivider={
                                                index < activeList.length - 1
                                            }
                                            theme={theme}
                                        />
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                    </Stack>
                </Card>
            )}
        </Droppable>
    );
}

// ─── Main export ──────────────────────────────────────────────────────

export default function DesktopFieldingDepthChart({
    positioning,
    players,
    handlePositionUpdate,
    managerView,
}) {
    const theme = useMantineTheme();
    const [activePosition, setActivePosition] = useState(
        Object.keys(fieldingPositions)[0],
    );
    const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
        useDisclosure(false);

    const getNormalizedList = (position) => {
        const list = positioning[position] || [];
        return list.map((item) =>
            typeof item === "string" ? { id: item, neverSub: false } : item,
        );
    };

    const handleAddPlayers = (playerIds) => {
        const currentList = getNormalizedList(activePosition);
        const currentIds = currentList.map((i) => i.id);
        const newIds = playerIds.filter((id) => !currentIds.includes(id));
        if (newIds.length > 0) {
            handlePositionUpdate(activePosition, [
                ...currentList,
                ...newIds.map((id) => ({ id, neverSub: false })),
            ]);
        }
    };

    const handleRemovePlayer = (playerId) => {
        handlePositionUpdate(
            activePosition,
            getNormalizedList(activePosition).filter(
                (item) => item.id !== playerId,
            ),
        );
    };

    const handleToggleNeverSub = (playerId, value) => {
        handlePositionUpdate(
            activePosition,
            getNormalizedList(activePosition).map((item) =>
                item.id === playerId ? { ...item, neverSub: value } : item,
            ),
        );
    };

    const onDragEnd = ({ source, destination }) => {
        if (!destination || source.index === destination.index) return;
        const list = [...getNormalizedList(activePosition)];
        const [moved] = list.splice(source.index, 1);
        list.splice(destination.index, 0, moved);
        handlePositionUpdate(activePosition, list);
    };

    const getPlayer = (id) => players.find((p) => p.$id === id);
    const activeList = getNormalizedList(activePosition);
    const lockedPlayerId = activeList.find((p) => p.neverSub)?.id;

    return (
        <>
            <Grid gutter="xl" align="flex-start">
                {/* Field image with clickable hotspots */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Box className={styles.fieldContainer}>
                        <Image
                            src={images.fieldSrc}
                            alt="Softball Field"
                            className={styles.fieldImage}
                            draggable={false}
                        />
                        {Object.entries(fieldingPositions).map(
                            ([position, { x, y }]) => (
                                <PositionHotspot
                                    key={position}
                                    position={position}
                                    coords={{ x, y }}
                                    isSelected={activePosition === position}
                                    assignedCount={
                                        (positioning[position] || []).length
                                    }
                                    onClick={setActivePosition}
                                />
                            ),
                        )}
                    </Box>
                </Grid.Col>

                {/* Depth chart for selected position */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack>
                        <Stack gap={2}>
                            <Title order={4}>{activePosition}</Title>
                            <Text size="sm" c="dimmed">
                                {activeList.length === 0
                                    ? "No players assigned"
                                    : `${activeList.length} player${activeList.length !== 1 ? "s" : ""} — drag to set priority`}
                            </Text>
                        </Stack>

                        {activeList.length === 0 ? (
                            <Card withBorder radius="lg" p="xl">
                                <Text c="dimmed" ta="center">
                                    No players assigned to {activePosition}.
                                </Text>
                            </Card>
                        ) : (
                            <DragDropContext onDragEnd={onDragEnd}>
                                <FielderDragList
                                    activeList={activeList}
                                    activePosition={activePosition}
                                    lockedPlayerId={lockedPlayerId}
                                    managerView={managerView}
                                    getPlayer={getPlayer}
                                    onRemove={handleRemovePlayer}
                                    onToggleNeverSub={handleToggleNeverSub}
                                    theme={theme}
                                />
                            </DragDropContext>
                        )}

                        {managerView && (
                            <Button
                                variant="light"
                                color="lime"
                                leftSection={<IconPlus size={16} />}
                                onClick={openDrawer}
                                fullWidth
                            >
                                Add Player to {activePosition}
                            </Button>
                        )}
                    </Stack>
                </Grid.Col>
            </Grid>

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
                    activePosition={activePosition}
                />
            </DrawerContainer>
        </>
    );
}
