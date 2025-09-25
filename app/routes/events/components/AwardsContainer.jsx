import { useState } from "react";

import { Card, Center, Image, Skeleton, Stack, Text } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { useDisclosure } from "@mantine/hooks";

import { IconAward } from "@tabler/icons-react";

import DeferredLoader from "@/components/DeferredLoader";
import DrawerContainer from "@/components/DrawerContainer";

import images from "@/constants/images";

import CardSection from "./CardSection";

import addPlayerAvailability from "../utils/addPlayerAvailability";

const awardsMap = {
    mvp: {
        description:
            "The one who brings it all together with outstanding performance and team leadership.",
    },
    hitting: {
        description:
            "For the player who consistently crushes the ball and racks up the RBIs.",
    },
    fielding: {
        description:
            "Awarded to the defensive wizard who makes the impossible plays look easy.",
    },
    running: {
        description:
            "To the speedster who turns singles into doubles and scores from anywhere.",
    },
    throwing: {
        description:
            "For the player with the most accurate and powerful arm on the field.",
    },
    manager: {
        description:
            "The strategic genius who leads the team to victory with brilliant decisions.",
    },
};

function AwardsDrawerContents({ attendance, awards, players, votes }) {
    const [activeAward, setActiveAward] = useState("mvp");
    console.log({ activeAward });

    const playersWithAvailability = addPlayerAvailability(
        attendance.documents,
        players,
    );

    console.log("Drawer: ", {
        playersWithAvailability,
        awards,
        votes,
    });

    const awardsList = Object.keys(awardsMap);
    console.log({ awardsList });

    return (
        <Stack justify="center" align="stretch">
            <Carousel
                controlsOffset="xs"
                slideSize="75%"
                slideGap="md"
                emblaOptions={{
                    loop: true,
                    dragFree: false,
                    align: "center",
                }}
                onSlideChange={(index) => setActiveAward(awardsList[index])}
            >
                {awardsList.map((key) => (
                    <Carousel.Slide key={key}>
                        <Card radius="xl" my="sm">
                            <Center>
                                <Image
                                    src={images[key]}
                                    alt={`${images[key]} icon`}
                                    mah={175}
                                    maw={175}
                                />
                            </Center>
                        </Card>
                    </Carousel.Slide>
                ))}
            </Carousel>
            <Text ta="center">{awardsMap[activeAward].description}</Text>
        </Stack>
    );
}

export default function AwardsContainer({ promises, playersPromise }) {
    const [awardsDrawerOpened, awardsDrawerHandlers] = useDisclosure(false);

    return (
        <>
            <Card withBorder radius="xl" mt="md" mx="md" py="5px">
                <CardSection
                    onClick={awardsDrawerHandlers.open}
                    heading="Awards & Recognition"
                    leftSection={<IconAward size={20} />}
                    subHeading={
                        <DeferredLoader
                            resolve={promises}
                            fallback={
                                <Skeleton
                                    height={16}
                                    width="70%"
                                    mt="5px"
                                    ml="28px"
                                    radius="xl"
                                />
                            }
                            errorElement={
                                <Text size="xs" mt="5px" ml="28px" c="red">
                                    Error loading awards details
                                </Text>
                            }
                        >
                            {({ awards, votes }) => {
                                console.log("CardSection: ", { awards, votes });

                                return (
                                    <Text
                                        size="xs"
                                        mt="5px"
                                        ml="28px"
                                        c="dimmed"
                                    >
                                        Awards unavailable at this time
                                    </Text>
                                );
                            }}
                        </DeferredLoader>
                    }
                />
            </Card>

            <DrawerContainer
                opened={awardsDrawerOpened}
                onClose={awardsDrawerHandlers.close}
                title="Awards & Recognition"
                size="xl"
            >
                <DeferredLoader
                    resolve={{ ...promises, players: playersPromise }}
                    fallback={
                        <Stack align="stretch" justify="center" gap="md">
                            <Skeleton height={200} radius="xl" my="lg" />
                            <Skeleton height={24} radius="xl" mb="md" />
                            <Skeleton height={24} radius="xl" mb="md" />
                            <Skeleton height={24} radius="xl" mb="md" />
                        </Stack>
                    }
                    errorElement={
                        <div>
                            <Text c="red">Error loading content.</Text>
                        </div>
                    }
                >
                    {(deferredData) => (
                        <AwardsDrawerContents {...deferredData} />
                    )}
                </DeferredLoader>
            </DrawerContainer>
        </>
    );
}
