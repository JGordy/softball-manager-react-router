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

const awardsArray = [
    "mvp",
    "hitting",
    "fielding",
    "running",
    "throwing",
    "manager",
];

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
                onSlideChange={(index) => setActiveAward(awardsArray[index])}
            >
                {awardsArray.map((key) => (
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
            <Text>Content for {activeAward} award here...</Text>
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
                            <Skeleton height={24} radius="xl" />
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
