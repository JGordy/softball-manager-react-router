import { useOutletContext } from 'react-router';
import { Anchor, Button, Group, Paper, Text } from '@mantine/core';

import {
    IconExternalLink,
    IconCircleCheckFilled,
    IconSquareXFilled,
    IconHelpTriangleFilled,
    IconCancel,
} from '@tabler/icons-react';

const availabilityIcon = {
    yes: <IconCircleCheckFilled size={24} color="green" />,
    no: <IconSquareXFilled size={24} color="red" />,
    maybe: <IconHelpTriangleFilled size={24} color="gray" />,
    noResponse: <IconCancel size={24} color="orange" />,
}

const availabilityOptions = [
    { value: 'Yes, I will be there', key: 'yes' },
    { value: 'No, I cannot attend', key: 'no' },
    { value: 'Maybe, I will let you know', key: 'maybe' },
];

function categorizePlayersByResponse(responses, players) {
    const availabilityMap = {};
    availabilityOptions.forEach(option => {
        availabilityMap[option.value] = option.key;
    });

    players.forEach(player => {
        player.availability = 'noResponse';
    });

    responses.forEach(response => {
        const player = players.find(p => p.email === response.respondentEmail);
        if (player) {
            player.availability = availabilityMap[response.answer] || 'noResponse';
        }
    });

    return players;
}

export default function AvailabliityContainer({ players, availability, handleAttendanceFormClick }) {
    const { user } = useOutletContext();
    const currentUserId = user.$id;

    console.log('AvailabliityContainer: ', { players, availability });
    const { form, responses } = availability;

    const formCreated = !!form?.formId;

    if (!formCreated) {
        return (
            <>
                <Text align="center" c="dimmed" my="lg">An availabliity form for this game has not yet been created. Create one below.</Text >
                <Button mt="sm" onClick={handleAttendanceFormClick} fullWidth>
                    Generate availabliity form
                </Button>
            </>
        );
    }

    const formHasResponses = responses && Object.keys(responses).length > 0;

    const sortedPlayers = formHasResponses && categorizePlayersByResponse(responses, players);

    const currentUserHasResponded = !responses?.noResponse?.includes(currentUserId);

    console.log('/events/:eventId > AvailabilityContainer: ', { sortedPlayers, currentUserHasResponded });

    const renderPlayerAvailability = () => players.map(player => (
        <Paper
            key={player.$id}
            shadow="sm"
            radius="lg"
            p="sm"
            mt="xs"
            withBorder
        >
            <Group justify="space-between">
                <Text fw={700}>{player.firstName} {player.lastName}</Text>
                <Text>{player.preferredPositions?.[0]}</Text>
                {availabilityIcon[player.availability]}
            </Group>
        </Paper>
    ));

    return (
        <>
            <Group mb="lg" justify="space-between">
                {Object.keys(availabilityIcon).map(key => (
                    <Group gap="2px">
                        {availabilityIcon[key]} - {key.toLowerCase()}
                    </Group>
                ))}
            </Group>
            {formHasResponses && renderPlayerAvailability()}

            {!formHasResponses && (
                <Text align="center" my="sm">No responses yet!</Text>
            )}

            {!currentUserHasResponded && (
                <Anchor
                    href={form.formUrl}
                    target="_blank"
                    fw={700}
                >
                    <Button mt="lg" fullWidth>
                        <IconExternalLink size={18} style={{ display: 'inline', marginRight: '5px' }} />
                        Add your availability
                    </Button>
                </Anchor>
            )}
        </>
    );
};