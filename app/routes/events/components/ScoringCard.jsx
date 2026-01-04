import { Card, Text, Badge, Group } from "@mantine/core";
import { IconScoreboard, IconActivity } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import CardSection from "./CardSection";

export default function ScoringCard({ gameId, isLive }) {
    const navigate = useNavigate();

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
                    Live Game Scoring
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
                onClick={() => navigate(`/events/${gameId}/scoring`)}
                heading="Score this Game"
                leftSection={<IconScoreboard size={20} />}
                subHeading={
                    <Text size="xs" ml="28px" mt="2px" c="dimmed">
                        {isLive
                            ? "Keep the book updated with real-time stats."
                            : "Access the granular play-by-play scoring interface."}
                    </Text>
                }
            />
        </Card>
    );
}
