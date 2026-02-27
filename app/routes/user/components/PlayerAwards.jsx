import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useDisclosure } from "@mantine/hooks";

import { Card, Center, Group, Image, Text } from "@mantine/core";
import { Carousel } from "@mantine/carousel";

import { IconChevronRight } from "@tabler/icons-react";

import awardsMap from "@/constants/awards";
import images from "@/constants/images";

import DeferredLoader from "@/components/DeferredLoader";
import { formatForViewerDate } from "@/utils/dateTime";

import StatsDetailDrawer from "./stats/StatsDetailDrawer";

export default function PlayerAwards({ awardsPromise, statsPromise }) {
    const navigate = useNavigate();

    const [activeAward, setActiveAward] = useState("mvp");
    const [initialSlide, setInitialSlide] = useState(0);
    const [initialSet, setInitialSet] = useState(false);
    const [opened, { open, close }] = useDisclosure(false);
    const [selectedGame, setSelectedGame] = useState(null);

    const awardsList = useMemo(() => Object.keys(awardsMap), []);

    useEffect(() => {
        let mounted = true;

        const setInitialFromAwards = async () => {
            try {
                const resolved = await awardsPromise;
                if (!mounted) return;

                // find the first award type that the user has
                const index = awardsList.findIndex((key) =>
                    resolved.some((a) => a.award_type === key),
                );

                if (index !== -1 && !initialSet) {
                    setInitialSlide(index);
                    setActiveAward(awardsList[index]);
                    setInitialSet(true);
                }
            } catch (err) {
                // ignore errors — leave defaults
                // console.error(err);
            }
        };

        setInitialFromAwards();

        return () => {
            mounted = false;
        };
    }, [awardsPromise]);

    return (
        <>
            <Carousel
                mt="md"
                controlsOffset="xs"
                slideSize="85%"
                slideGap="md"
                emblaOptions={{
                    loop: true,
                    dragFree: false,
                    align: "center",
                }}
                // getEmblaApi={(api) => setEmbla(api)}
                initialSlide={initialSlide}
                onSlideChange={(index) => setActiveAward(awardsList[index])}
            >
                {awardsList.map((key) => (
                    <Carousel.Slide key={key}>
                        <Card radius="xl" my="sm">
                            <Center>
                                <Image
                                    src={images[key]}
                                    alt={`${images[key]} icon`}
                                    mah={125}
                                    maw={125}
                                />
                            </Center>
                            <Text ta="center" size="sm" mb="md">
                                {awardsMap[activeAward].description}
                            </Text>
                        </Card>
                    </Carousel.Slide>
                ))}
            </Carousel>

            <DeferredLoader resolve={awardsPromise} fallback={null}>
                {(resolvedAwards = []) => {
                    const awardsForType = resolvedAwards
                        .filter((a) => a.award_type === activeAward)
                        .sort((a, b) => {
                            // newest first
                            const ta = a.decided_at
                                ? new Date(a.decided_at).getTime()
                                : 0;
                            const tb = b.decided_at
                                ? new Date(b.decided_at).getTime()
                                : 0;
                            return tb - ta;
                        });

                    if (!awardsForType.length) {
                        return (
                            <Card radius="md" mt="xs" withBorder>
                                <Text ta="center" c="dimmed" size="md">
                                    No{" "}
                                    {awardsMap[activeAward]?.label ||
                                        activeAward}{" "}
                                    awards yet
                                </Text>
                            </Card>
                        );
                    }

                    const handleAwardClick = async (gameId) => {
                        let data;
                        try {
                            data = await statsPromise;
                        } catch (e) {
                            navigate(`/events/${gameId}?open=awards`);
                            return;
                        }

                        if (!data) {
                            navigate(`/events/${gameId}?open=awards`);
                            return;
                        }

                        const { games = [], logs = [], teams = [] } = data;
                        let game = games.find((g) => g.$id === gameId);
                        if (!game) {
                            navigate(`/events/${gameId}?open=awards`);
                            return;
                        }

                        game.team = teams.find((t) => t.$id === game.teamId);
                        const gameLogs = logs.filter(
                            (l) => l.gameId === gameId,
                        );

                        setSelectedGame({ game, logs: gameLogs });
                        open();
                    };

                    return awardsForType.map((award) => (
                        <div key={award.$id}>
                            <Card
                                component="button"
                                radius="md"
                                my="xs"
                                withBorder
                                className="winner-card"
                                style={{ cursor: "pointer", width: "100%" }}
                                onClick={() => handleAwardClick(award.game_id)}
                            >
                                <Group justify="space-between">
                                    <Text size="md" ta="center">
                                        {formatForViewerDate(award.decided_at)}
                                    </Text>
                                    <IconChevronRight size={20} />
                                </Group>
                            </Card>
                        </div>
                    ));
                }}
            </DeferredLoader>

            <StatsDetailDrawer
                opened={opened}
                onClose={close}
                game={selectedGame?.game}
                logs={selectedGame?.logs}
            />
        </>
    );
}
