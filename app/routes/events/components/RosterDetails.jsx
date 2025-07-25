import {
    Card,
    Divider,
    Group,
    Skeleton,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import {
    IconChevronRight,
    IconClipboardList,
    IconUsersGroup,
} from '@tabler/icons-react';

import DrawerContainer from '@/components/DrawerContainer';
import DeferredLoader from '@/components/DeferredLoader';

import AvailablityContainer from './AvailablityContainer';
import LineupContainer from './LineupContainer';

import addPlayerAvailability from '../utils/addPlayerAvailability';

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
                        {({ availability, players }) => {
                            const { responses } = availability;
                            const playersWithAvailability = addPlayerAvailability(responses, players);
                            const availablePlayers = playersWithAvailability.filter(p => p.available === 'yes');
                            return (
                                <Text size="xs" mt="5px" ml="28px" c="dimmed">
                                    {`${responses?.length || 0} responses, ${availablePlayers?.length || 0} ${availablePlayers?.length === 1 ? 'player' : 'players'} available`}
                                </Text>
                            );
                        }}
                    </DeferredLoader>
                </Card.Section>
            </Card>

            <DeferredLoader resolve={deferredData}>
                {({ availability, players }) => {
                    const { responses } = availability;
                    const playersWithAvailability = addPlayerAvailability(responses, players);
                    const availablePlayers = playersWithAvailability.filter(p => p.available === 'yes');
                    return (
                        <DrawerContainer
                            opened={lineupDrawerOpened}
                            onClose={lineupDrawerHandlers.close}
                            title="Lineup Details"
                            size={playerChart ? 'xl' : 'sm'}
                        >
                            <LineupContainer
                                availablePlayers={availablePlayers}
                                game={game}
                                managerView={managerView}
                                playerChart={playerChart}
                                players={players}
                            />
                        </DrawerContainer>
                    );
                }}
            </DeferredLoader>

            <DeferredLoader resolve={deferredData}>
                {({ availability, players }) => {
                    const playersWithAvailability = addPlayerAvailability(availability.responses, players);
                    return (
                        <DrawerContainer
                            opened={availabilityDrawerOpened}
                            onClose={availabilityDrawerHandlers.close}
                            title="Availability Details"
                            size={availability.responses?.length ? 'xl' : 'md'}
                        >
                            <AvailablityContainer
                                availability={availability}
                                game={game}
                                managerView={managerView}
                                players={playersWithAvailability}
                                team={team}
                            />
                        </DrawerContainer>
                    );
                }}
            </DeferredLoader>
        </>
    );
}