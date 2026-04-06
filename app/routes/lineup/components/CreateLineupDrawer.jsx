import { useOutletContext } from "react-router";

import { Button, Card, Group, Stack, Text, ThemeIcon } from "@mantine/core";

import { IconPencil, IconSparkles, IconUsers } from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer";

function OptionCard({ icon, title, description, onClick, disabled, gradient }) {
    return (
        <Card
            withBorder
            radius="md"
            p="md"
            style={{ opacity: disabled ? 0.5 : 1 }}
        >
            <Group gap="md" align="flex-start" wrap="nowrap">
                <ThemeIcon
                    variant={gradient ? "gradient" : "light"}
                    gradient={
                        gradient ? { from: "blue", to: "cyan" } : undefined
                    }
                    size="lg"
                    radius="md"
                >
                    {icon}
                </ThemeIcon>
                <Stack gap={4} style={{ flex: 1 }}>
                    <Text fw={600} size="sm">
                        {title}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {description}
                    </Text>
                </Stack>
            </Group>
            <Button
                mt="sm"
                fullWidth
                disabled={disabled}
                onClick={onClick}
                variant={gradient ? "gradient" : "light"}
                gradient={gradient ? { from: "blue", to: "cyan" } : undefined}
            >
                {title}
            </Button>
        </Card>
    );
}

export default function CreateLineupDrawer({
    opened,
    onClose,
    availablePlayers,
    onStartFromScratch,
    onCreateWithAvailable,
    onOpenAiDrawer,
}) {
    const { isDesktop } = useOutletContext();

    const acceptedCount = availablePlayers?.length ?? 0;
    const canCreateWithAvailable = acceptedCount >= 1;
    const canGenerateAI = acceptedCount >= 9;

    return (
        <DrawerContainer
            title="Create Lineup"
            opened={opened}
            onClose={onClose}
            size={isDesktop ? "md" : "xl"}
        >
            <Stack gap="md">
                <OptionCard
                    icon={<IconPencil size={22} />}
                    title="Start from Scratch"
                    description="Build your lineup manually by adding players one by one."
                    onClick={onStartFromScratch}
                />
                <OptionCard
                    icon={<IconUsers size={22} />}
                    title="Create with Available Players"
                    description={
                        canCreateWithAvailable
                            ? `Auto-generate a batting order and fielding chart from your ${acceptedCount} available player${acceptedCount === 1 ? "" : "s"}.`
                            : "No players have accepted yet. Check back once players have responded."
                    }
                    onClick={onCreateWithAvailable}
                    disabled={!canCreateWithAvailable}
                />
                <OptionCard
                    icon={<IconSparkles size={22} />}
                    title="Generate AI Lineup"
                    description={
                        canGenerateAI
                            ? "Use AI to generate an optimized lineup based on player stats and preferences."
                            : `Requires 9 or more available players (${acceptedCount} available).`
                    }
                    onClick={onOpenAiDrawer}
                    gradient
                />
            </Stack>
        </DrawerContainer>
    );
}
