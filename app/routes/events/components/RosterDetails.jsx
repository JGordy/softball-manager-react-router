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
                    {!playerChart && <Text size="xs" mt="5px" ml="28px" c="dimmed">Charts currently not available</Text>}
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
                size={playerChart ? 'xl' : 'sm'}
            >
                {playerChart ? (
                    <PlayerChart playerChart={playerChart} />
                ) : (
                    <Stack align="center">
                        {managerView ? <IconClipboardList size={48} /> : <IconZoomQuestion size={48} />}
                        <Text mb="xl" align="center">Lineup and fielding chart for this game has not yet been created. {managerView ? 'As an admin, you can create them below.' : 'Please check back later.'}</Text>
                    </Stack>
                )}
                {managerView && (
                    <Link to={`/events/${game.$id}/lineup`}>
                        <Card c="green">
                            <Text align="center">{playerChart ? 'Edit' : 'Create'} Lineup & Field Charts</Text>
                        </Card>
                    </Link>
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