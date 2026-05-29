import { Card, Divider, Skeleton, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import { IconClock, IconMapPin } from "@tabler/icons-react";

import { formatGameTime } from "@/utils/dateTime";

import DeferredLoader from "@/components/DeferredLoader";
import InlineError from "@/components/InlineError";

import CardSection from "./CardSection";

export default function DetailsCard({
    game,
    deferredData,
    season,
    team,
    calendarDrawerHandlers: propCalendarDrawerHandlers,
    locationDrawerHandlers: propLocationDrawerHandlers,
}) {
    const { gameDate, timeZone } = game;

    const formattedGameTime = formatGameTime(gameDate, timeZone);

    const [_, localLocationDrawerHandlers] = useDisclosure(false);
    const [__, localCalendarDrawerHandlers] = useDisclosure(false);

    const locationDrawerHandlers =
        propLocationDrawerHandlers || localLocationDrawerHandlers;

    const calendarDrawerHandlers =
        propCalendarDrawerHandlers || localCalendarDrawerHandlers;

    return (
        <>
            <Card radius="lg" mt="-12%" mx="md" py="5px">
                <Text size="sm" mt="xs">
                    Date & Location Details
                </Text>

                <CardSection
                    onClick={calendarDrawerHandlers.open}
                    heading={formattedGameTime}
                    leftSection={<IconClock size={20} />}
                />

                <Divider />

                <CardSection
                    onClick={locationDrawerHandlers.open}
                    heading={
                        game?.location ||
                        season?.location ||
                        "Loading location..."
                    }
                    leftSection={<IconMapPin size={20} />}
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
                                <InlineError
                                    message="Details unavailable"
                                    mt="5px"
                                    ml="28px"
                                />
                            }
                        >
                            {({ park }) => (
                                <>
                                    {park?.googleMapsURI ? (
                                        <Text
                                            size="xs"
                                            mt="5px"
                                            ml="28px"
                                            c="dimmed"
                                        >
                                            {park?.formattedAddress ||
                                                "Address not listed"}
                                        </Text>
                                    ) : (
                                        <Text
                                            size="xs"
                                            mt="5px"
                                            ml="28px"
                                            c="dimmed"
                                        >
                                            {game?.location ||
                                                season?.location ||
                                                "Location not specified"}
                                        </Text>
                                    )}
                                    {game?.locationNotes && (
                                        <Text
                                            size="xs"
                                            mt="2px"
                                            ml="28px"
                                            fw={500}
                                            c="blue"
                                        >
                                            {game.locationNotes}
                                        </Text>
                                    )}
                                </>
                            )}
                        </DeferredLoader>
                    }
                />
            </Card>
        </>
    );
}
