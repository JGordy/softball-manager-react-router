import { Card, Skeleton, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

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
                size="95%"
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
