import { Link } from 'react-router';
import {
    Card,
    Divider,
    Group,
    Skeleton,
    Stack,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import {
    IconChevronRight,
    IconClipboardList,
    IconUsersGroup,
    IconZoomQuestion,
} from '@tabler/icons-react';

import DrawerContainer from '@/components/DrawerContainer';
import DeferredLoader from '@/components/DeferredLoader';

import AvailablityContainer from './AvailablityContainer';

import addPlayerAvailability from '../utils/addPlayerAvailability';
import PlayerChart from '@/components/PlayerChart';

export default function RosterDetails({
    deferredData,
    game,
    managerView,
    playerChart,
    team,
}) {

    const [lineupDrawerOpened, lineupDrawerHandlers] = useDisclosure(false);
    const [availabilityDrawerOpened, availabilityDrawerHandlers] = useDisclosure(false);

    return (
        <>
            <Card withBorder radius="lg" mt="xl" mx="md" py="5px">

                <Text size="sm" mt="xs">Roster & Availability Details</Text>

                <Card.Section my="xs" inheritPadding>
                    <Group justify="space-between" c="green" onClick={lineupDrawerHandlers.open}>
                        <Group gap="xs" c="green">
                            <IconClipboardList size={18} />
                            Lineup & Field Chart
                        </Group>
                        <IconChevronRight size={18} />
                    </Group>
                    {!playerChart ? (
                        <Text size="xs" mt="5px" ml="28px" c="dimmed">Charts currently not available</Text>
                    ) : (
                        <Text size="xs" mt="5px" ml="28px" c="dimmed">Charts available to view</Text>

                    )}
                </Card.Section>

                <Divider />

                <Card.Section my="xs" inheritPadding>
                    <Group justify='space-between' onClick={availabilityDrawerHandlers.open} c="green">
                        <Group gap="xs">
                            <IconUsersGroup size={18} />
                            Player Availability
                        </Group>
                        <IconChevronRight size={18} />
                    </Group>
                    <DeferredLoader
                        resolve={deferredData}
                        fallback={<Skeleton height={16} width="70%" mt="5px" ml="28px" radius="xl" />}
                        errorElement={<Text size="xs" mt="5px" ml="28px" c="red">Error loading details.</Text>}
                    >
                        {({ attendance, players }) => {
                            const { documents } = attendance;
                            const playersWithAvailability = addPlayerAvailability(documents, players);
                            const availablePlayers = playersWithAvailability.filter(p => p.available === 'accepted');
                            return (
                                <Text size="xs" mt="5px" ml="28px" c="dimmed">
                                    {`${documents?.length || 0} responses, ${availablePlayers?.length || 0} ${availablePlayers?.length === 1 ? 'player' : 'players'} available`}
                                </Text>
                            );
                        }}
                    </DeferredLoader>
                </Card.Section>
            </Card>

            <DrawerContainer
                opened={lineupDrawerOpened}
                onClose={lineupDrawerHandlers.close}
                title="Lineup Details"
                size={playerChart ? '75%' : 'sm'}
            >
                {playerChart ? (
                    <Card p="sm" radius="lg">
                        <PlayerChart playerChart={playerChart} />
                    </Card>
                ) : (
                    <>
                        <Group mb="md">
                            {managerView ? <IconClipboardList size={24} /> : <IconZoomQuestion size={24} />}
                            <Divider orientation="vertical" />
                            Charts not yet created
                        </Group>

                        <Text c="dimmed">Lineup and fielding chart for this game has not yet been created. {managerView ? 'As an admin, you can create them below.' : 'Please check back later.'}</Text>
                    </>
                )}
                {managerView && (
                    <Card c="green" mt="xl">
                        <Link to={`/events/${game.$id}/lineup`} onClick={lineupDrawerHandlers.close}>
                            <Text align="center">{playerChart ? 'Edit' : 'Create'} Lineup & Field Charts</Text>
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
                            size="75%"
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