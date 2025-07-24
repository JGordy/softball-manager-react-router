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

const availabilityOptions = [
    { value: 'Yes, I will be there', key: 'yes' },
    { value: 'No, I cannot attend', key: 'no' },
    { value: 'Maybe, I will let you know', key: 'maybe' },
];

function updatePlayerAvailability(responses, players) {
    const playersCopy = [...players];

    const availabilityMap = {};
    availabilityOptions.forEach(option => {
        availabilityMap[option.value] = option.key;
    });

    playersCopy.forEach(player => {
        player.availability = 'noresponse';
    });

    responses.forEach(response => {
        const player = playersCopy.find(p => p.email === response.respondentEmail);
        if (player) {
            player.available = availabilityMap[response.answer] || 'noResponse';
        }
    });

    return playersCopy;
}

export default function RosterDetails({
    availability,
    game,
    managerView,
    playerChart,
    players,
    team,
}) {

    const { responses } = availability;

    const formHasResponses = responses && Object.keys(responses).length > 0;

    if (formHasResponses) updatePlayerAvailability(responses, players);

    const availablePlayers = players.filter(player => player.available === 'yes');

    console.log('RosterDetails: ', { availability, game, managerView, playerChart, availablePlayers, players });


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