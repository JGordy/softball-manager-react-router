import { Link } from "react-router";
import { Button, Card, Divider, Group, Skeleton, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import {
    IconClipboardList,
    IconEdit,
    IconPrinter,
    IconUsersGroup,
    IconZoomQuestion,
} from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer";
import DeferredLoader from "@/components/DeferredLoader";
import InlineError from "@/components/InlineError";
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

    const handlePrintLineup = () => {
        window?.print();
    };

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
                                <InlineError
                                    message="Error loading details"
                                    mt="5px"
                                    ml="28px"
                                />
                            }
                        >
                            {({ attendance, players }) => {
                                const { rows } = attendance;
                                const playersWithAvailability =
                                    addPlayerAvailability(rows, players);
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
                                        {`${rows?.length || 0} responses, ${availablePlayers?.length || 0} ${availablePlayers?.length === 1 ? "player" : "players"} available`}
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

                <Group justify="space-between" mt="md" grow wrap="nowrap">
                    {managerView && (
                        <Button
                            component={Link}
                            to={`/events/${game.$id}/lineup`}
                            onClick={lineupDrawerHandlers.close}
                            size="md"
                        >
                            <Group justify="center" gap="xs" wrap="nowrap">
                                <IconEdit size={18} />
                                <Text align="center">
                                    {playerChart ? "Edit" : "Create"} Charts
                                </Text>
                            </Group>
                        </Button>
                    )}
                    {playerChart && (
                        <Button
                            color="blue"
                            onClick={handlePrintLineup}
                            size="md"
                        >
                            <Group justify="center" gap="xs" wrap="nowrap">
                                <IconPrinter size={18} />
                                Print
                            </Group>
                        </Button>
                    )}
                </Group>
            </DrawerContainer>

            <DrawerContainer
                opened={availabilityDrawerOpened}
                onClose={availabilityDrawerHandlers.close}
                title="Availability Details"
                size="95%"
            >
                <DeferredLoader
                    resolve={deferredData}
                    errorElement={
                        <InlineError message="Unable to load availability data" />
                    }
                >
                    {({ attendance, players }) => {
                        return (
                            <AvailablityContainer
                                attendance={attendance}
                                game={game}
                                managerView={managerView}
                                players={players}
                                team={team}
                            />
                        );
                    }}
                </DeferredLoader>
            </DrawerContainer>
        </>
    );
}
