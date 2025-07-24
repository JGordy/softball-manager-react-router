import {
    Card,
    Divider,
    Group,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import {
    IconChevronRight,
    IconClipboardList,
    IconUsersGroup,
} from '@tabler/icons-react';

import DrawerContainer from '@/components/DrawerContainer';
import AvailabliityContainer from './AvailabliityContainer';
import LineupContainer from './LineupContainer';

export default function RosterDetails({
    availability,
    availablePlayers,
    game,
    managerView,
    playerChart,
    players,
    team,
}) {

    console.log('RosterDetails: ', { availability, game, managerView, playerChart, availablePlayers, players });

    const { responses } = availability;

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
                    <Text size="xs" mt="5px" ml="28px" c="dimmed">
                        {`${responses?.length || 0} responses, ${availablePlayers?.length || 0} ${availablePlayers?.length === 1 ? 'player' : 'players'} available`}
                    </Text>
                </Card.Section>
            </Card>

            <DrawerContainer
                opened={lineupDrawerOpened}
                onClose={lineupDrawerHandlers.close}
                title="Lineup Details"
                size="xl"
            >
                <LineupContainer
                    availablePlayers={availablePlayers}
                    game={game}
                    managerView={managerView}
                    playerChart={playerChart}
                />
            </DrawerContainer>

            <DrawerContainer
                opened={availabilityDrawerOpened}
                onClose={availabilityDrawerHandlers.close}
                title="Availability Details"
                size="xl"
            >
                <AvailabliityContainer
                    availability={availability}
                    game={game}
                    managerView={managerView}
                    players={players}
                    team={team}
                />
            </DrawerContainer>
        </>
    );
}