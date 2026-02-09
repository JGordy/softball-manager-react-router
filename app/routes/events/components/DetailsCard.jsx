import { Card, Divider, Skeleton, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import { IconClock, IconMapPin } from "@tabler/icons-react";

import { formatGameTime } from "@/utils/dateTime";

import DrawerContainer from "@/components/DrawerContainer";
import DeferredLoader from "@/components/DeferredLoader";
import InlineError from "@/components/InlineError";

import ParkDetailsDrawer from "./ParkDetailsDrawer";
import CalendarDetails from "./CalendarDetails";
import CardSection from "./CardSection";

export default function DetailsCard({ game, deferredData, season, team }) {
    const { gameDate, timeZone } = game;

    const formattedGameTime = formatGameTime(gameDate, timeZone);

    const [locationDrawerOpened, locationDrawerHandlers] = useDisclosure(false);
    const [calendarDrawerOpened, calendarDrawerHandlers] = useDisclosure(false);

    return (
        <>
            <Card withBorder radius="lg" mt="-12%" mx="md" py="5px">
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

            <DeferredLoader
                resolve={deferredData}
                fallback={null}
                errorElement={null}
            >
                {({ park }) => (
                    <>
                        <DrawerContainer
                            opened={calendarDrawerOpened}
                            onClose={calendarDrawerHandlers.close}
                            title="Add Game to Calendar"
                            size="sm"
                        >
                            <CalendarDetails
                                game={game}
                                park={park}
                                team={team}
                            />
                        </DrawerContainer>
                        {park && (
                            <DrawerContainer
                                opened={locationDrawerOpened}
                                onClose={locationDrawerHandlers.close}
                                title="Location Details"
                                size="sm"
                            >
                                <ParkDetailsDrawer park={park} />
                            </DrawerContainer>
                        )}
                    </>
                )}
            </DeferredLoader>
        </>
    );
}
