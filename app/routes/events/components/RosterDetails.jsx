import { Link } from "react-router";
import { Card, Divider, Group, Skeleton, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import {
    IconClipboardList,
    IconUsersGroup,
    IconZoomQuestion,
} from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer";
import DeferredLoader from "@/components/DeferredLoader";
import PlayerChart from "@/components/PlayerChart";

import addPlayerAvailability from "../utils/addPlayerAvailability";

import AvailablityContainer from "./AvailablityContainer";
import CardSection from "./CardSection";

export default function RosterDetails({
    deferredData,
    game,
    managerView,
    playerChart,
    team,
}) {
    const [lineupDrawerOpened, lineupDrawerHandlers] = useDisclosure(false);
    const [availabilityDrawerOpened, availabilityDrawerHandlers] =
        useDisclosure(false);

    return (
        <>
            <Card withBorder radius="lg" mt="md" mx="md" py="5px">
                <Text size="sm" mt="xs">
                    Roster & Availability Details
                </Text>

                <CardSection
                    onClick={lineupDrawerHandlers.open}
                    heading="Lineup & Field Chart"
                    leftSection={<IconClipboardList size={20} />}
                    subHeading={
                        !playerChart ? (
                            <Text size="xs" mt="5px" ml="28px" c="dimmed">
                                Charts currently not available
                            </Text>
                        ) : (
                            <Text size="xs" mt="5px" ml="28px" c="dimmed">
                                Charts available to view
                            </Text>
                        )
                    }
                />

                <Divider />

                <CardSection
                    onClick={availabilityDrawerHandlers.open}
                    heading="Player Availability"
                    leftSection={<IconUsersGroup size={20} />}
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
                                <Text size="xs" mt="5px" c="red">
                                    Error loading details.
                                </Text>
                            }
                        >
                            {({ attendance, players }) => {
                                const { documents } = attendance;
                                const playersWithAvailability =
                                    addPlayerAvailability(documents, players);
                                const availablePlayers =
                                    playersWithAvailability.filter(
                                        (p) => p.availability === "accepted",
                                    );
                                return (
                                    <Text
                                        size="xs"
                                        mt="5px"
                                        ml="28px"
                                        c="dimmed"
                                    >
                                        {`${documents?.length || 0} responses, ${availablePlayers?.length || 0} ${availablePlayers?.length === 1 ? "player" : "players"} available`}
                                    </Text>
                                );
                            }}
                        </DeferredLoader>
                    }
                />
            </Card>

            <DrawerContainer
                opened={lineupDrawerOpened}
                onClose={lineupDrawerHandlers.close}
                title="Lineup Details"
                size={playerChart ? "xl" : "sm"}
            >
                {playerChart ? (
                    <Card p="sm" radius="lg">
                        <PlayerChart playerChart={playerChart} />
                    </Card>
                ) : (
                    <>
                        <Group mb="md">
                            {managerView ? (
                                <IconClipboardList size={24} />
                            ) : (
                                <IconZoomQuestion size={24} />
                            )}
                            <Divider orientation="vertical" />
                            Charts not yet created
                        </Group>

                        <Text c="dimmed">
                            Lineup and fielding chart for this game has not yet
                            been created.{" "}
                            {managerView
                                ? "As an admin, you can create them below."
                                : "Please check back later."}
                        </Text>
                    </>
                )}
                {managerView && (
                    <Card c="green" mt="xl">
                        <Link
                            to={`/events/${game.$id}/lineup`}
                            onClick={lineupDrawerHandlers.close}
                        >
                            <Text align="center">
                                {playerChart ? "Edit" : "Create"} Lineup & Field
                                Charts
                            </Text>
                        </Link>
                    </Card>
                )}
            </DrawerContainer>

            <DeferredLoader resolve={deferredData}>
                {({ attendance, players }) => {
                    return (
                        <DrawerContainer
                            opened={availabilityDrawerOpened}
                            onClose={availabilityDrawerHandlers.close}
                            title="Availability Details"
                            size="xl"
                        >
                            <AvailablityContainer
                                attendance={attendance}
                                game={game}
                                managerView={managerView}
                                players={players}
                                team={team}
                            />
                        </DrawerContainer>
                    );
                }}
            </DeferredLoader>
        </>
    );
}
