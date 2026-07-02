import { useFetcher, Link, useParams } from "react-router";
import { Text, Group, Button } from "@mantine/core";
import {
    IconFlag,
    IconPlayerPlay,
    IconArrowsExchange,
    IconClipboardList,
    IconChartBar,
    IconRefresh,
    IconUserMinus,
} from "@tabler/icons-react";

import MenuContainer from "@/components/MenuContainer";
import useModal from "@/hooks/useModal";

export default function GamedayMenu({
    gameFinal,
    score,
    opponentScore,
    onSubBatter,
    onRemovePlayer,
    opponentScoringMode,
    onToggleOpponentScoringMode,
    isOurBatting,
    opponentChart,
    opponentOrderIndex,
    onOpenSelectBatterDrawer,
    opponentLineupLocked,
    menuId,
    game,
    inning,
    halfInning,
}) {
    const fetcher = useFetcher();
    const { eventId } = useParams();
    const { openModal, closeAllModals } = useModal();

    const handleEndGame = () => {
        openModal({
            title: "End Game",
            children: (
                <>
                    <Text size="sm" mb="md">
                        Are you sure you want to end this game? This will
                        prevent any further scoring changes.
                    </Text>
                    <Group justify="flex-end" mt="xl">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={closeAllModals}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            onClick={() => {
                                fetcher.submit(
                                    {
                                        _action: "end-game",
                                        gameFinal: true,
                                        score,
                                        opponentScore,
                                    },
                                    { method: "post" },
                                );
                                closeAllModals();
                            }}
                        >
                            End Game
                        </Button>
                    </Group>
                </>
            ),
        });
    };

    const handleResumeGame = () => {
        openModal({
            title: "Resume Game",
            children: (
                <>
                    <Text size="sm" mb="md">
                        Are you sure you want to resume this game? This will
                        enable scoring controls again.
                    </Text>
                    <Group justify="flex-end" mt="xl">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={closeAllModals}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="blue"
                            onClick={() => {
                                fetcher.submit(
                                    {
                                        _action: "resume-game",
                                        gameFinal: false,
                                    },
                                    { method: "post" },
                                );
                                closeAllModals();
                            }}
                        >
                            Resume Game
                        </Button>
                    </Group>
                </>
            ),
        });
    };

    const gameControls = [
        {
            key: "edit-lineup",
            component: Link,
            to: `/events/${eventId}/lineup`,
            leftSection: <IconClipboardList size={14} />,
            content: <Text>Edit Lineup</Text>,
        },
        ...(gameFinal
            ? [
                  {
                      key: "resume-game",
                      onClick: handleResumeGame,
                      leftSection: <IconPlayerPlay size={14} />,
                      content: <Text>Resume Game</Text>,
                  },
              ]
            : [
                  {
                      key: "end-game",
                      onClick: handleEndGame,
                      leftSection: <IconFlag size={14} />,
                      content: <Text>End Game</Text>,
                  },
              ]),
    ];

    const handleWrapLineup = () => {
        openModal({
            title: "Back to Top of Order?",
            children: (
                <>
                    <Text size="sm" mb="md">
                        This will lock the opponent's lineup size and
                        immediately wrap back to Batter 1 (skipping the current
                        batter).
                    </Text>
                    <Group justify="flex-end" mt="xl">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={closeAllModals}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="blue"
                            onClick={() => {
                                const targetLength = Math.max(
                                    1,
                                    opponentOrderIndex,
                                );
                                let resolvedOpponentLineup = [...opponentChart];
                                if (
                                    resolvedOpponentLineup.length < targetLength
                                ) {
                                    const missingCount =
                                        targetLength -
                                        resolvedOpponentLineup.length;
                                    const padding = Array.from({
                                        length: missingCount,
                                    }).map((_, i) => {
                                        const idx =
                                            resolvedOpponentLineup.length + i;
                                        return {
                                            $id: `OPP_BAT_${idx + 1}`,
                                            firstName: "Batter",
                                            lastName: `${idx + 1}`,
                                            substitutions: [],
                                        };
                                    });
                                    resolvedOpponentLineup = [
                                        ...resolvedOpponentLineup,
                                        ...padding,
                                    ];
                                }
                                fetcher.submit(
                                    {
                                        _action: "lock-opponent-lineup",
                                        opponentLineupLocked: true,
                                        opponentLineup: JSON.stringify(
                                            resolvedOpponentLineup.slice(
                                                0,
                                                targetLength,
                                            ),
                                        ),
                                        oldOpponentLineup:
                                            JSON.stringify(opponentChart),
                                        teamId: game?.teamId,
                                        inning: String(inning || 1),
                                        halfInning: halfInning || "top",
                                    },
                                    { method: "post" },
                                );
                                closeAllModals();
                            }}
                        >
                            Confirm
                        </Button>
                    </Group>
                </>
            ),
        });
    };

    // Only show Sub Batter when the game is active and a sub callback is provided
    if (!gameFinal && onSubBatter) {
        gameControls.unshift({
            key: "sub-batter",
            onClick: onSubBatter,
            leftSection: <IconArrowsExchange size={14} />,
            content: <Text>Sub Current Batter</Text>,
        });
    }

    if (!gameFinal && onRemovePlayer) {
        gameControls.unshift({
            key: "remove-player",
            onClick: onRemovePlayer,
            leftSection: <IconUserMinus size={14} />,
            content: <Text>Remove Player (Injury)</Text>,
        });
    }

    const opponentControls = [
        {
            key: "toggle-scoring-mode",
            onClick: onToggleOpponentScoringMode,
            leftSection: <IconChartBar size={14} />,
            content: (
                <Text>
                    {opponentScoringMode === "Basic"
                        ? "Detailed Scoring"
                        : "Basic Scoring"}
                </Text>
            ),
        },
    ];

    if (opponentScoringMode === "Detailed" && !isOurBatting) {
        opponentControls.push({
            key: "set-active-batter",
            onClick: onOpenSelectBatterDrawer,
            leftSection: <IconClipboardList size={14} />,
            content: <Text>Set Active Batter</Text>,
        });

        if (!opponentLineupLocked) {
            opponentControls.push({
                key: "wrap-lineup",
                onClick: handleWrapLineup,
                leftSection: <IconRefresh size={14} />,
                content: <Text>Top of Lineup (Wrap)</Text>,
            });
        }
    }

    const sections = [
        {
            label: "Game Controls",
            items: gameControls,
        },
        ...(!gameFinal && !isOurBatting
            ? [
                  {
                      label: "Opponent Controls",
                      items: opponentControls,
                  },
              ]
            : []),
    ];

    return <MenuContainer id={menuId} sections={sections} />;
}
