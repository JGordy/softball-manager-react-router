import { useOutletContext } from 'react-router';

import {
    Anchor,
    Button,
    Group,
    Paper,
    Text,
} from '@mantine/core';

import {
    IconCancel,
    IconCircleCheckFilled,
    IconExternalLink,
    IconHelpTriangleFilled,
    IconSquareXFilled,
} from '@tabler/icons-react';

const availabilityIcon = {
    yes: <IconCircleCheckFilled size={24} color="green" />,
    no: <IconSquareXFilled size={24} color="red" />,
    maybe: <IconHelpTriangleFilled size={24} color="gray" />,
    noResponse: <IconCancel size={24} color="orange" />,
}

export default function AvailabliityContainer({
    availability,
    gameDate,
    handleAttendanceFormClick,
    managerView,
    players,
}) {

    const { user } = useOutletContext();
    const currentUserId = user.$id;

    const { form, responses } = availability;

    const formCreated = !!form?.formId;

    const today = new Date();
    const gameDay = new Date(gameDate);
    const isGameToday = gameDay.toDateString() === today.toDateString();

    if (!formCreated) {
        return (
            <>
                {managerView ? (
                    <>
                        <Text align="center" c="dimmed" my="lg">An availabliity form for this game has not yet been created. Create one below.</Text >
                        <Button mt="sm" onClick={handleAttendanceFormClick} fullWidth>
                            Generate Availabliity Form
                        </Button>
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

    const currentUserHasResponded = !responses?.noResponse?.includes(currentUserId);

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
                {availabilityIcon[player.available]}
            </Group>
        </Paper>
    ));

    return (
        <>
            <Group mb="lg" justify="space-between">
                {Object.keys(availabilityIcon).map(key => (
                    <Group gap="2px" key={key}>
                        {availabilityIcon[key]} - {key.toLowerCase()}
                    </Group>
                ))}
            </Group>
            {formHasResponses && renderPlayerAvailability()}

            {!formHasResponses && (
                <Text align="center" my="sm">No responses yet!</Text>
            )}

            {isGameToday ? (
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