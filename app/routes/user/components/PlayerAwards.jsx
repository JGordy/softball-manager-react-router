import { useMemo, useState } from "react";
import { Link } from "react-router";

import { Card, Center, Group, Image, Text, Stack } from "@mantine/core";
import { Carousel } from "@mantine/carousel";

import { IconChevronRight } from "@tabler/icons-react";

import awardsMap from "@/constants/awards";
import images from "@/constants/images";

import DeferredLoader from "@/components/DeferredLoader";
import { formatForViewerDate } from "@/utils/dateTime";

export default function PlayerAwards({ awardsPromise }) {
    const [activeAward, setActiveAward] = useState("mvp");

    const awardsList = useMemo(() => Object.keys(awardsMap), []);

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

                    return awardsForType.map((award) => (
                        <Link to={`/events/${award.game_id}`} key={award.$id}>
                            <Card
                                radius="md"
                                my="xs"
                                withBorder
                                component="div"
                                className="winner-card"
                            >
                                <Group justify="space-between">
                                    <Text size="md" ta="center">
                                        {formatForViewerDate(award.decided_at)}
                                    </Text>
                                    <IconChevronRight size={20} />
                                </Group>
                            </Card>
                        </Link>
                    ));
                }}
            </DeferredLoader>
        </>
    );
}
