import { useMemo } from "react";

import { Card, Image, Skeleton, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import { IconAward } from "@tabler/icons-react";

import DeferredLoader from "@/components/DeferredLoader";
import DrawerContainer from "@/components/DrawerContainer";

import images from "@/constants/images";

import CardSection from "./CardSection";

import addPlayerAvailability from "../utils/addPlayerAvailability";

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
                            <Skeleton height={100} circle />
                            <Skeleton height={24} radius="xl" />
                        </Stack>
                    }
                    errorElement={
                        <div>
                            <Text c="red">Error loading content.</Text>
                        </div>
                    }
                >
                    {({ attendance, awards, players, votes }) => {
                        const playersWithAvailability = addPlayerAvailability(
                            attendance.documents,
                            players,
                        );
                        console.log("Drawer: ", {
                            playersWithAvailability,
                            awards,
                            votes,
                        });
                        // Render your actual drawer content here using the resolved data
                        return (
                            <Stack justify="center" align="center">
                                <Image
                                    src={images.gameMvp}
                                    alt="MVP Icon"
                                    mah={200}
                                    maw={200}
                                />
                                Awards Content Goes Here
                            </Stack>
                        );
                    }}
                </DeferredLoader>
            </DrawerContainer>
        </>
    );
}
