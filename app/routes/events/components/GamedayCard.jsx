import { useNavigate } from "react-router";
import { Card, Text, Badge, Group } from "@mantine/core";
import {
    IconScoreboard,
    IconActivity,
    IconArrowUpRight,
    IconClipboardData,
} from "@tabler/icons-react";

import CardSection from "./CardSection";

export default function GamedayCard({ gameId, isLive, isPast, canScore }) {
    const navigate = useNavigate();

    let titleLabel = "Gameday Hub";
    let heading = canScore ? "Score the Game" : "Follow The Action";
    let subHeading = canScore
        ? "Access real-time scoring, stats, and play-by-play."
        : "Follow the game with live updates and box scores.";
    let leftSection = <IconScoreboard size={20} />;

    if (isPast) {
        titleLabel = "Gameday Recap";
        heading = "View Stats & Recap";
        subHeading = "Check out the play-by-play and final box score.";
        leftSection = <IconClipboardData size={20} />;
    } else if (isLive) {
        titleLabel = "Ongoing Gameday";
        if (canScore) {
            heading = "Score this Game";
            subHeading = "Keep the book updated with real-time stats.";
        } else {
            heading = "Follow the Action";
            subHeading = "Watch the play-by-play unfold in real-time.";
        }
    }

    return (
        <Card
            withBorder
            radius="lg"
            mx="md"
            mt="md"
            py="5px"
            bg={isLive ? "var(--mantine-color-lime-light)" : undefined}
            style={
                isLive
                    ? { borderColor: "var(--mantine-color-lime-outline)" }
                    : {}
            }
        >
            <Group justify="space-between" mt="xs">
                <Text
                    size="sm"
                    fw={isLive ? 700 : 400}
                    c={isLive ? "lime" : undefined}
                >
                    {titleLabel}
                </Text>
                {isLive && (
                    <Badge
                        color="lime"
                        variant="filled"
                        size="sm"
                        leftSection={<IconActivity size={12} />}
                    >
                        LIVE NOW
                    </Badge>
                )}
            </Group>

            <CardSection
                onClick={() => navigate(`/events/${gameId}/gameday`)}
                heading={heading}
                leftSection={leftSection}
                rightSection={<IconArrowUpRight size={18} />}
                subHeading={
                    <Text size="xs" ml="28px" mt="2px" c="dimmed">
                        {subHeading}
                    </Text>
                }
            />
        </Card>
    );
}
