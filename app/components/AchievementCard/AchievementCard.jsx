import { DateTime } from "luxon";

import {
    Badge,
    Card,
    Text,
    Group,
    Stack,
    ThemeIcon,
    Box,
    Tooltip,
} from "@mantine/core";

import {
    IconTrophy,
    IconMedal,
    IconBallBaseball,
    IconCalendar,
    IconBolt,
    IconConfetti,
    IconMeteor,
    IconPercentage,
    IconRefresh,
    IconScoreboard,
} from "@tabler/icons-react";

import classes from "./AchievementCard.module.css";

// Map rarity to colors
const rarityColors = {
    legendary: "#FFD700", // Gold
    epic: "#9C27B0", // Purple
    rare: "#2196F3", // Blue
    uncommon: "#4CAF50", // Green
    common: "#9E9E9E", // Gray
};

const defaultColor = "#495057";

// Optional icon mapping if you store icon string identifiers in DB
const iconMapping = {
    trophy: IconTrophy,
    medal: IconMedal,
    bat: IconBallBaseball, // Using baseball icon for bat hitting achievements
    calendar: IconCalendar,
    rbi: IconScoreboard,
    sprint: IconBolt,
    slam: IconMeteor,
    confetti: IconConfetti,
    percent: IconPercentage,
    cycle: IconRefresh,
};

export default function AchievementCard({
    achievement,
    unlockedAt = null,
    isLocked = false,
    playerName = null,
    isMe = false,
}) {
    if (!achievement) return null;

    const { name, description, rarity, icon } = achievement;

    const rarityColor = rarity
        ? rarityColors[rarity.toLowerCase()] || defaultColor
        : defaultColor;

    const IconElement = iconMapping[icon] || IconTrophy;

    const isLegendary = rarity?.toLowerCase() === "legendary";
    const isEpic = rarity?.toLowerCase() === "epic";
    const hasSpecialEffect = isLegendary || isEpic;

    const content = (
        <Box
            className={`${classes.root} ${hasSpecialEffect && !isLocked ? classes.rootWithEffect : ""} ${isLocked ? classes.locked : ""}`}
            style={{ "--rarity-color": rarityColor }}
            data-testid="achievement-card"
        >
            <Box className={`${classes.haloContainer} ${hasSpecialEffect && !isLocked ? classes.haloContainerWithEffect : ""}`}>
                {!isLocked && hasSpecialEffect && (
                    <Box className={classes.halo} />
                )}

                <Card
                    className={`${classes.card} ${hasSpecialEffect && !isLocked ? classes.cardWithEffect : ""}`}
                    withBorder
                    radius="md"
                    padding="md"
                    style={{
                        borderColor: isLocked ? "gray.8" : `${rarityColor}60`,
                        opacity: isLocked ? 0.6 : 1,
                    }}
                >
                    <Stack gap="md">
                        {/* Header Row: Rarity + Player */}
                        <Group justify="space-between" align="center">
                            {rarity && !isLocked && (
                                <Badge
                                    variant="filled"
                                    color={rarityColor}
                                    size="sm"
                                    radius="sm"
                                    leftSection={<IconTrophy size={10} />}
                                    style={{ textTransform: "uppercase", fontSize: "10px" }}
                                    data-testid="achievement-rarity-badge"
                                >
                                    {rarity}
                                </Badge>
                            )}

                            {playerName && !isLocked && (
                                <Badge
                                    color={isMe ? "lime" : "blue"}
                                    size="xs"
                                    radius="xl"
                                    variant="filled"
                                    style={{
                                        textTransform: "uppercase",
                                        fontSize: "9px",
                                        flexShrink: 0
                                    }}
                                    data-testid="achievement-player-badge"
                                >
                                    {isMe && <Box component="span" mr={4} style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />}
                                    {playerName}
                                </Badge>
                            )}
                        </Group>

                        {/* Content Area: Large Icon + Text */}
                        <Group wrap="nowrap" align="center" gap="md">
                            <ThemeIcon
                                size={48}
                                radius="md"
                                variant={isLocked ? "light" : "filled"}
                                className={classes.icon}
                                style={{
                                    backgroundColor: isLocked ? "transparent" : `${rarityColor}15`,
                                    color: isLocked ? "gray" : rarityColor,
                                    border: isLocked ? "1px dashed var(--mantine-color-gray-6)" : `1px solid ${rarityColor}30`,
                                }}
                            >
                                <IconElement size={24} stroke={1.5} />
                            </ThemeIcon>

                            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                <Text
                                    fw={800}
                                    size="lg"
                                    className={isLocked ? classes.titleLocked : classes.title}
                                    style={{ lineHeight: 1.2 }}
                                >
                                    {name}
                                </Text>
                                <Text size="sm" className={classes.description}>
                                    {isLocked ? "Keep playing to unlock this achievement." : description}
                                </Text>
                            </Stack>
                        </Group>

                        {/* Footer: Metadata Box */}
                        {!isLocked && (
                            <Box className={classes.innerBox}>
                                <Group justify="space-between" align="center">
                                    <Text className={classes.statLabel}>Unlocked</Text>
                                    <Text className={classes.statValue}>
                                        {unlockedAt ? DateTime.fromISO(unlockedAt).toFormat("LLL dd, yyyy") : "---"}
                                    </Text>
                                </Group>
                            </Box>
                        )}
                    </Stack>
                </Card>
            </Box>
        </Box>
    );

    // If it's locked, perhaps show the actual description in a tooltip instead
    if (isLocked) {
        return (
            <Tooltip label={description} position="top" withArrow multiline w={250}>
                {content}
            </Tooltip>
        );
    }

    return content;
}
