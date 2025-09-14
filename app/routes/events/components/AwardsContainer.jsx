import { useMemo } from "react";
import { Card, Skeleton, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import { IconAward } from "@tabler/icons-react";

import DeferredLoader from "@/components/DeferredLoader";
import DrawerContainer from "@/components/DrawerContainer";

import CardSection from "./CardSection";

export default function AwardsContainer({
    awardsPromise,
    playersPromise,
    votesPromise,
}) {
    const [awardsDrawerOpened, awardsDrawerHandlers] = useDisclosure(false);

    const promises = useMemo(
        () => ({
            awards: awardsPromise,
            players: playersPromise,
            votes: votesPromise,
        }),
        [awardsPromise, playersPromise, votesPromise],
    );

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
            >
                <DeferredLoader
                    resolve={promises}
                    fallback={
                        <div>
                            <Skeleton height={24} mt="5px" radius="xl" />
                        </div>
                    }
                    errorElement={
                        <div>
                            <Text c="red">Error loading content.</Text>
                        </div>
                    }
                >
                    {({ awards, players, votes }) => {
                        console.log("Drawer: ", { awards, players, votes });
                        // Render your actual drawer content here using the resolved data
                        return <div>Awards Content Goes Here</div>;
                    }}
                </DeferredLoader>
            </DrawerContainer>
        </>
    );
}
