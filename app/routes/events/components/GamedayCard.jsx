import { useNavigate } from "react-router";
import { Card, Text, Badge, Group } from "@mantine/core";
import {
    IconScoreboard,
    IconActivity,
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
            bg={isLive ? "rgba(64, 192, 87, 0.05)" : undefined}
            style={
                isLive
                    ? { borderColor: "var(--mantine-color-green-outline)" }
                    : {}
            }
        >
            <Group justify="space-between" mt="xs">
                <Text
                    size="sm"
                    fw={isLive ? 700 : 400}
                    c={isLive ? "green" : undefined}
                >
                    {titleLabel}
                </Text>
                {isLive && (
                    <Badge
                        color="green"
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
                subHeading={
                    <Text size="xs" ml="28px" mt="2px" c="dimmed">
                        {subHeading}
                    </Text>
                }
            />
        </Card>
    );
}
