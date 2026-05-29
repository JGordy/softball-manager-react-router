import { useState } from "react";
import { Link } from "react-router";
import {
    Button,
    Card,
    Divider,
    Group,
    SegmentedControl,
    Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
    IconClipboardList,
    IconEdit,
    IconPrinter,
    IconZoomQuestion,
    IconChevronRight,
} from "@tabler/icons-react";

import { trackEvent } from "@/utils/analytics";
import DrawerContainer from "@/components/DrawerContainer";
import PlayerChart from "@/components/PlayerChart";
import FieldLineupPreview from "./FieldLineupPreview";
import fieldingPositions from "@/constants/positions";

/**
 * RosterDetails Component
 * Acts as the dedicated visual centerpiece for the "Lineup & Field Chart" on mobile.
 * Embeds a responsive field visualization of Inning 1 player positions and opens
 * the Lineup Details drawer when tapped.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.game - The active game document data.
 * @param {Array} props.playerChart - The parsed and enriched player chart lineup.
 * @param {Boolean} props.managerView - Whether the logged-in user is a manager.
 * @returns {React.ReactElement} The lineup centerpiece widget card.
 */
export default function RosterDetails({ game, managerView, playerChart }) {
    const isPractice = game.eventType === "practice";
    const [lineupDrawerOpened, lineupDrawerHandlers] = useDisclosure(false);
    const [view, setView] = useState("field"); // "field" or "lineup"

    const handlePrintLineup = () => {
        window?.print();
        trackEvent("print-lineup", { eventId: game.$id });
    };

    if (isPractice) {
        return null;
    }

    return (
        <>
            <Card
                radius="lg"
                mt="md"
                mx="md"
                p="md"
                data-testid="roster-details"
            >
                <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={700}>
                        Lineup &amp; Field Chart
                    </Text>
                    <IconChevronRight
                        size={18}
                        style={{ cursor: "pointer" }}
                        onClick={lineupDrawerHandlers.open}
                    />
                </Group>

                {playerChart && (
                    <SegmentedControl
                        value={view}
                        onChange={setView}
                        fullWidth
                        mt="xs"
                        mb="xs"
                        size="xs"
                        radius="md"
                        color="blue"
                        data-testid="lineup-view-segmented-control"
                        data={[
                            { label: "Field View", value: "field" },
                            { label: "Lineup View", value: "lineup" },
                        ]}
                    />
                )}

                <div
                    style={{ cursor: "pointer" }}
                    onClick={lineupDrawerHandlers.open}
                    data-testid="lineup-field-chart-card-wrapper"
                >
                    {playerChart ? (
                        view === "field" ? (
                            <FieldLineupPreview playerChart={playerChart} />
                        ) : (
                            <div
                                data-testid="card-player-chart-container"
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    marginTop: "8px",
                                }}
                            >
                                {playerChart.map((player, index) => {
                                    const jerseySuffix = player.jerseyNumber
                                        ? ` #${player.jerseyNumber}`
                                        : "";
                                    const displayName = `${player.firstName} ${player.lastName ? player.lastName.charAt(0) + "." : ""}${jerseySuffix}`;

                                    const startingPos = player.positions?.[0];
                                    const positionInitials =
                                        startingPos && startingPos !== "Out"
                                            ? fieldingPositions[startingPos]
                                                  ?.initials || "Out"
                                            : "Out";

                                    return (
                                        <Group
                                            key={player.$id || index}
                                            justify="space-between"
                                            py="8px"
                                            style={{
                                                borderBottom:
                                                    index <
                                                    playerChart.length - 1
                                                        ? "1px solid var(--mantine-color-default-border)"
                                                        : "none",
                                            }}
                                        >
                                            <Group gap="sm">
                                                <Text
                                                    size="sm"
                                                    fw={700}
                                                    c="dimmed"
                                                    w={20}
                                                    ta="right"
                                                    mr="xs"
                                                >
                                                    {index + 1}
                                                </Text>
                                                <Text size="sm" fw={600}>
                                                    {displayName}
                                                </Text>
                                            </Group>
                                            <Text size="sm" fw={700} c="dimmed">
                                                {positionInitials}
                                            </Text>
                                        </Group>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "28px 16px",
                                borderRadius: "12px",
                                border: "1.5px dashed rgba(204, 255, 51, 0.2)",
                                background: "rgba(31, 41, 55, 0.4)",
                                backdropFilter: "blur(4px)",
                                marginTop: "12px",
                            }}
                        >
                            <IconClipboardList
                                size={32}
                                style={{
                                    color: "#CCFF33",
                                    marginBottom: "12px",
                                    filter: "drop-shadow(0 0 6px rgba(204, 255, 51, 0.45))",
                                }}
                            />
                            <Text
                                size="sm"
                                fw={700}
                                c="white"
                                ta="center"
                                mb={4}
                            >
                                No Lineup Set Yet
                            </Text>
                            <Text
                                size="xs"
                                c="dimmed"
                                ta="center"
                                style={{ maxWidth: "260px", lineHeight: 1.4 }}
                            >
                                {managerView
                                    ? "Tap here to draft the batting order and assign fielding positions."
                                    : "The manager hasn't posted the lineup yet. Check back closer to game time!"}
                            </Text>
                        </div>
                    )}
                </div>
            </Card>

            <DrawerContainer
                opened={lineupDrawerOpened}
                onClose={lineupDrawerHandlers.close}
                title="Lineup Details"
                size={playerChart ? "xl" : "sm"}
            >
                {playerChart ? (
                    <Card p="sm" radius="lg">
                        <PlayerChart playerChart={playerChart} />
                    </Card>
                ) : (
                    <>
                        <Group mb="md">
                            {managerView ? (
                                <IconClipboardList size={24} />
                            ) : (
                                <IconZoomQuestion size={24} />
                            )}
                            <Divider orientation="vertical" />
                            Charts not yet created
                        </Group>

                        <Text c="dimmed">
                            Lineup and fielding chart for this game has not yet
                            been created.{" "}
                            {managerView
                                ? "As an admin, you can create them below."
                                : "Please check back later."}
                        </Text>
                    </>
                )}

                <Group justify="space-between" mt="md" grow wrap="nowrap">
                    {managerView && (
                        <Button
                            component={Link}
                            to={`/events/${game.$id}/lineup`}
                            onClick={lineupDrawerHandlers.close}
                            size="md"
                        >
                            <Group justify="center" gap="xs" wrap="nowrap">
                                <IconEdit size={18} />
                                <Text align="center">
                                    {playerChart ? "Edit" : "Create"} Charts
                                </Text>
                            </Group>
                        </Button>
                    )}
                    {playerChart && (
                        <Button
                            color="blue"
                            onClick={handlePrintLineup}
                            size="md"
                        >
                            <Group justify="center" gap="xs" wrap="nowrap">
                                <IconPrinter size={18} />
                                Print
                            </Group>
                        </Button>
                    )}
                </Group>
            </DrawerContainer>
        </>
    );
}
