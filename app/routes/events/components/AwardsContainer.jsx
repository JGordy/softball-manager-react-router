import { Card, Skeleton, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useCallback, useState } from "react";

import { IconAward } from "@tabler/icons-react";

import DeferredLoader from "@/components/DeferredLoader";
import DrawerContainer from "@/components/DrawerContainer";

import CardSection from "./CardSection";
import AwardsDrawerContents from "./AwardsDrawerContents";

export default function AwardsContainer({
    game,
    team,
    promises,
    playersPromise,
    user,
}) {
    const [awardsDrawerOpened, awardsDrawerHandlers] = useDisclosure(false);
    const [currentPromises, setCurrentPromises] = useState(promises);

    const handleOpen = useCallback(() => {
        setCurrentPromises({ ...promises, players: playersPromise });
        awardsDrawerHandlers.open();
    }, [promises, playersPromise, awardsDrawerHandlers]);

    return (
        <>
            <Card withBorder radius="xl" mt="md" mx="md" py="5px">
                <CardSection
                    onClick={handleOpen}
                    heading="Awards & Recognition"
                    leftSection={<IconAward size={20} />}
                    subHeading={
                        <DeferredLoader
                            resolve={currentPromises}
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
                                const awardsTotal = awards?.total ?? 0;
                                const votesTotal = votes?.total ?? 0;

                                let message = "Awards unavailable at this time";
                                let color = "dimmed";

                                if (awardsTotal > 0) {
                                    message = "Awards ready for view";
                                    color = "blue";
                                } else if (votesTotal > 0) {
                                    message = "Voting in progress";
                                    color = "yellow";
                                }

                                return (
                                    <Text
                                        size="xs"
                                        mt="5px"
                                        ml="28px"
                                        c={color}
                                    >
                                        {message}
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
                size="95%"
            >
                <DeferredLoader
                    resolve={currentPromises}
                    fallback={
                        <Stack align="stretch" justify="center" gap="md">
                            <Skeleton height={180} radius="xl" mb="lg" />
                            <Skeleton height={73} radius="xl" mb="md" />
                            <Skeleton height={48} radius="xl" mb="md" />
                            <Skeleton height={48} radius="xl" mb="md" />
                            <Skeleton height={48} radius="xl" mb="md" />
                            <Skeleton height={48} radius="xl" mb="md" />
                        </Stack>
                    }
                    errorElement={
                        <div>
                            <Text c="red">Error loading content.</Text>
                        </div>
                    }
                >
                    {(deferredData) => (
                        <AwardsDrawerContents
                            game={game}
                            team={team}
                            user={user}
                            {...deferredData}
                        />
                    )}
                </DeferredLoader>
            </DrawerContainer>
        </>
    );
}
