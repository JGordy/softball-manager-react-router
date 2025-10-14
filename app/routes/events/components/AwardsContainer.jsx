import { Card, Skeleton, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useCallback } from "react";

import { IconAward } from "@tabler/icons-react";

import DeferredLoader from "@/components/DeferredLoader";
import DrawerContainer from "@/components/DrawerContainer";

import CardSection from "./CardSection";
import AwardsDrawerContents from "./AwardsDrawerContents";

export default function AwardsContainer({
    game,
    team,
    deferredData,
    playersPromise,
    user,
}) {
    const [awardsDrawerOpened, awardsDrawerHandlers] = useDisclosure(false);

    const handleOpen = useCallback(() => {
        awardsDrawerHandlers.open();
    }, [awardsDrawerHandlers]);

    return (
        <>
            <Card withBorder radius="xl" mt="md" mx="md" py="5px">
                <CardSection
                    onClick={handleOpen}
                    heading="Awards & Recognition"
                    leftSection={<IconAward size={20} />}
                    subHeading={
                        <DeferredLoader
                            resolve={deferredData}
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
                    resolve={deferredData}
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
                    {(deferred) => (
                        <AwardsDrawerContents
                            game={game}
                            team={team}
                            user={user}
                            {...deferred}
                        />
                    )}
                </DeferredLoader>
            </DrawerContainer>
        </>
    );
}
