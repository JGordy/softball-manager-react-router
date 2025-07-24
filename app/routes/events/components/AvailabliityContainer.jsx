import { useOutletContext, useFetcher } from 'react-router';

import {
    Anchor,
    Button,
    Card,
    Group,
    Paper,
    Stack,
    Text,
} from '@mantine/core';

import {
    IconMessageCircleOff,
    IconCircleCheckFilled,
    IconExternalLink,
    IconHelpTriangleFilled,
    IconSquareXFilled,
} from '@tabler/icons-react';

const availabilityData = {
    yes: {
        icon: <IconCircleCheckFilled size={24} color="green" />,
        label: 'Yes',
    },
    no: {
        icon: <IconSquareXFilled size={24} color="red" />,
        label: 'No',
    },
    maybe: {
        icon: <IconHelpTriangleFilled size={24} color="orange" />,
        label: 'Maybe',
    },
    noresponse: {
        icon: <IconMessageCircleOff size={24} color="gray" />,
        label: 'No Response',
    },
}

export default function AvailabliityContainer({
    availability,
    game,
    managerView,
    players,
    team,
}) {

    const fetcher = useFetcher();

    const { user } = useOutletContext();
    const currentUserId = user.$id;

    const { gameDate, opponent, $id: gameId } = game;
    const { form, responses } = availability;

    const formCreated = !!form?.formId;

    const today = new Date();
    const gameDay = new Date(gameDate);
    const isGameToday = gameDay.toDateString() === today.toDateString();
    const isGamePast = gameDay < today && !isGameToday;

    const handleAttendanceFormClick = async () => {
        try {
            const formData = new FormData();
            formData.append('_action', 'create-attendance');
            formData.append('team', JSON.stringify(team));
            formData.append('gameDate', gameDate);
            formData.append('opponent', opponent);
            formData.append('gameId', gameId);

            fetcher.submit(formData, { method: 'post', action: `/events/${gameId}` }); // Use fetcher.submit
        } catch (error) {
            console.error('Error submitting attendance form:', error);
        }
    };

    if ((!formCreated && !isGamePast)) {
        return (
            <>
                {managerView ? (
                    <>
                        <Text align="center" c="dimmed" my="lg">An availabliity form for this game has not yet been created. Create one below.</Text >
                        <Button
                            mt="sm"
                            onClick={handleAttendanceFormClick}
                            loading={fetcher.state === 'loading'}
                            disabled={fetcher.state === 'loading'}
                            fullWidth
                        >
                            Generate Availabliity Form
                        </Button>
                        {fetcher.state === 'error' && (
                            <Text c="red" mt="sm">
                                An error occurred while generating the form.
                            </Text>
                        )}
                    </>
                ) : (
                    <Text align="center" c="dimmed" my="lg">
                        Availability form not yet ready. Come back later
                    </Text>
                )}
            </>
        );
    }

    const formHasResponses = responses && Object.keys(responses).length > 0;

    const currentUserHasResponded = responses?.filter(response => response.respondentEmail === user.email).length > 0;

    const renderPlayerAvailability = () => players.map(player => (
        <Paper
            key={player.$id}
            shadow="sm"
            radius="md"
            p="sm"
            mt="xs"
            withBorder
        >
            <Group justify="space-between">
                <Text fw={700}>{player.firstName} {player.lastName}</Text>
                <Text>{player.preferredPositions?.[0]}</Text>
                {availabilityData[player.available || 'noresponse'].icon}
            </Group>
        </Paper>
    ));

    return (
        <>
            <Group justify="space-between" wrap="nowrap" mb="lg">
                {Object.keys(availabilityData).map(key => (
                    <Stack align="center" gap="2px" key={key}>
                        {availabilityData[key].icon}{availabilityData[key].label}
                    </Stack>
                ))}
            </Group>

            {formHasResponses && renderPlayerAvailability()}

            {(!formHasResponses && !isGamePast) && (
                <Text align="center" my="sm">No responses yet!</Text>
            )}

            {(isGameToday || isGamePast) ? (
                <Text align="center" mt="lg" fw={700} c="red">
                    The availability form for this game is now closed.
                </Text>
            ) : (
                !currentUserHasResponded && (
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
                )
            )}
        </>
    );
};