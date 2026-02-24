import { useEffect, useState } from "react";
import dompurify from "dompurify";

import { Alert, Card, Stack, Text, Group, Tabs, Button } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

import TabsWrapper from "@/components/TabsWrapper";
import markdownStyles from "@/styles/markdown.module.css";

export default function ResultsView({
    generatedLineup,
    aiReasoning,
    onRegenerate,
    onApply,
    generationsUsed = 0,
    maxGenerations = 3,
}) {
    const [sanitizedReasoning, setSanitizedReasoning] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined" && aiReasoning) {
            setSanitizedReasoning(dompurify.sanitize(aiReasoning));
        }
    }, [aiReasoning]);

    const isLimitReached = generationsUsed >= maxGenerations;

    return (
        <>
            <TabsWrapper defaultValue="lineup" mt="0">
                <Tabs.Tab value="lineup">Lineup</Tabs.Tab>
                <Tabs.Tab value="reasoning">AI Analysis</Tabs.Tab>

                <Tabs.Panel value="lineup" pt="md">
                    <Alert
                        icon={<IconCheck size={16} />}
                        title="Lineup Generated!"
                        color="lime"
                        mb="md"
                    >
                        AI has generated a lineup with {generatedLineup.length}{" "}
                        players. Review it below, then click "Apply Lineup" to
                        use it.
                    </Alert>

                    <Card withBorder p="md">
                        <Text fw={700} size="sm" mb="xs">
                            Batting Order Preview
                        </Text>
                        <Stack gap="xs">
                            {generatedLineup.map((player, index) => (
                                <Group key={player.$id} gap="xs" wrap="nowrap">
                                    <Text
                                        size="sm"
                                        c="dimmed"
                                        style={{
                                            minWidth: "20px",
                                        }}
                                    >
                                        {index + 1}.
                                    </Text>
                                    <Text size="sm">
                                        {player.firstName} {player.lastName}
                                    </Text>
                                    <Text size="xs" c="dimmed" ml="auto">
                                        ({player.gender})
                                    </Text>
                                </Group>
                            ))}
                        </Stack>
                    </Card>

                    <Text size="sm" c="dimmed" mt="md">
                        The fielding positions for each inning have also been
                        assigned. You can review and edit them after applying.
                    </Text>
                </Tabs.Panel>

                <Tabs.Panel value="reasoning" pt="md">
                    {aiReasoning ? (
                        <Card
                            withBorder
                            p="md"
                            bg="var(--mantine-color-blue-light)"
                        >
                            <Text fw={700} size="sm" mb="md">
                                AI Analysis
                            </Text>
                            <div
                                className={markdownStyles.markdown}
                                dangerouslySetInnerHTML={{
                                    __html: sanitizedReasoning,
                                }}
                            />
                        </Card>
                    ) : (
                        <Text c="dimmed" size="sm">
                            No reasoning provided.
                        </Text>
                    )}
                </Tabs.Panel>
            </TabsWrapper>

            <Group justify="space-between" mt="xl">
                <Button
                    variant="subtle"
                    onClick={onRegenerate}
                    disabled={isLimitReached}
                >
                    {isLimitReached ? "Limit Reached" : "Regenerate"}
                </Button>
                <Button
                    style={{ flexGrow: 1 }}
                    variant="filled"
                    color="lime"
                    onClick={onApply}
                    leftSection={<IconCheck size={18} />}
                >
                    Apply Lineup
                </Button>
            </Group>
        </>
    );
}
