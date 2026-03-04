import { Link } from "react-router";
import {
    Box,
    Button,
    Card,
    Group,
    Stack,
    Text,
    ThemeIcon,
} from "@mantine/core";

import {
    IconClipboardList,
    IconEdit,
    IconPrinter,
    IconZoomQuestion,
} from "@tabler/icons-react";

import PlayerChart from "@/components/PlayerChart";

import { trackEvent } from "@/utils/analytics";

export default function DesktopLineupPanel({ game, managerView, playerChart }) {
    const handlePrintLineup = () => {
        // Extract the lineup table from the DOM and print it in a clean new window.
        // Using window.print() directly is unreliable on desktop because the PlayerChart
        // lives inside Mantine Tabs + responsive containers that fight the @media print CSS.
        const tableEl = document.querySelector(".printable table");
        if (!tableEl) return;

        const printWindow = window.open("", "_blank", "noopener,noreferrer");
        if (!printWindow) return;

        // Explicitly sever the opener reference to prevent tabnabbing.
        printWindow.opener = null;

        const doc = printWindow.document;
        doc.title = "Lineup Chart";

        const style = doc.createElement("style");
        style.textContent = `
            @page { size: landscape; margin: 10mm; }
            body { font-family: 'Open Sans', sans-serif; margin: 0; padding: 0; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 6px 12px; font-size: 12px; text-align: left; }
            th { background: #f0f0f0; font-weight: 600; }
            tr:nth-child(even) { background: #f9f9f9; }
            a { color: inherit; text-decoration: none; }
        `;
        doc.head.appendChild(style);
        doc.body.innerHTML = tableEl.outerHTML;

        printWindow.focus();
        // Small delay lets the new window finish rendering before print dialog opens
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);

        trackEvent("print-lineup", { eventId: game.$id });
    };

    return (
        <>
            <Card
                withBorder
                radius="lg"
                p="xl"
                data-testid="desktop-lineup-panel"
            >
                <Group justify="space-between" align="center" mb="md">
                    <Group gap="xs">
                        <IconClipboardList
                            size={18}
                            color="var(--mantine-color-lime-5)"
                        />
                        <Text
                            size="xs"
                            tt="uppercase"
                            fw={600}
                            c="dimmed"
                            ls={1}
                        >
                            Lineup &amp; Field Chart
                        </Text>
                    </Group>

                    <Group gap="xs">
                        {managerView && (
                            <Button
                                component={Link}
                                to={`/events/${game.$id}/lineup`}
                                size="sm"
                                variant="light"
                                leftSection={<IconEdit size={16} />}
                            >
                                {playerChart ? "Edit" : "Create"}
                            </Button>
                        )}
                        {playerChart && (
                            <Button
                                size="sm"
                                color="blue"
                                variant="light"
                                leftSection={<IconPrinter size={16} />}
                                onClick={handlePrintLineup}
                            >
                                Print
                            </Button>
                        )}
                    </Group>
                </Group>

                {playerChart ? (
                    <Box>
                        <Card p="sm" radius="lg">
                            <PlayerChart playerChart={playerChart} />
                        </Card>
                    </Box>
                ) : (
                    <Stack align="center" gap="xs" py="xl">
                        <ThemeIcon
                            size={56}
                            radius="xl"
                            variant="light"
                            color={managerView ? "lime" : "gray"}
                        >
                            {managerView ? (
                                <IconClipboardList size={30} />
                            ) : (
                                <IconZoomQuestion size={30} />
                            )}
                        </ThemeIcon>
                        <Text size="sm" fw={600} c="dimmed" mt="xs">
                            {managerView
                                ? "No lineup created yet"
                                : "Lineup not yet available"}
                        </Text>
                        <Text size="xs" c="dimmed" ta="center" maw={280}>
                            {managerView
                                ? "Use the Create button above to build your batting order and field chart."
                                : "The manager hasn't published a lineup for this game yet. Check back closer to game time."}
                        </Text>
                    </Stack>
                )}
            </Card>
        </>
    );
}
