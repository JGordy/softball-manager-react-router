
import { useState, useEffect } from 'react';

import {
    Alert,
    Button,
    Card,
    Container,
    Divider,
    Group,
    Modal,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';

import { IconCurrencyDollar, IconCalendar, IconMapPin, IconFriends, IconCalendarRepeat } from '@tabler/icons-react';

import { adjustColorBasedOnDarkness } from '@/utils/adjustHexColor';

import { useAuth } from '@/contexts/auth/useAuth';

import PlayerForm from './components/PlayerForm';
import PlayerList from './components/PlayerList';

import { createPlayer } from './action';
import { getTeamData } from './loader';

export async function action({ request, params }) {
    return createPlayer({ request, params });
};

export async function loader({ params }) {
    const { teamId } = params;
    return getTeamData({ teamId });
};

export default function TeamDetails({ actionData, loaderData }) {
    const { teamData, players, coachId } = loaderData;

    const { user } = useAuth();

    const coachView = coachId === user?.$id;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamDetails, setTeamDetails] = useState(teamData || {});
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData && actionData.status === 200) {
                    setError(null);
                    setIsModalOpen(false);
                } else if (actionData instanceof Error) {
                    setError(actionData.message);
                }
            } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
                setError("An error occurred during player creation.");
            }
        };

        handleAfterSubmit();
    }, [actionData]);

    const { primaryColor } = teamDetails;
    const adjustedColor = adjustColorBasedOnDarkness(primaryColor, 50);

    const iconProps = {
        variant: 'gradient',
        gradient: { from: primaryColor, to: adjustedColor, deg: 270 },
        size: 'lg',
        // autoContrast: true, // Only works when not using gradients?
    };

    const textProps = {
        size: "md",
        // c: "dimmed",
    }

    return (
        <Container size="xl" p="xl">
            <Title order={2} align="center" mt="sm" mb="lg">
                {teamDetails.name}
            </Title>
            <Text {...textProps} align="center">
                {teamDetails.leagueName}
            </Text>
            <Divider my="sm" />

            <Stack spacing="sm">
                {/* <Group spacing="xs">
                    <ThemeIcon {...iconProps}>
                        <IconMapPin size={18} />
                    </ThemeIcon>
                    <Text {...textProps}>
                        {season.location || "Location not specified"}
                    </Text>
                </Group> */}

                {/* <Group spacing="xs">
                    <ThemeIcon {...iconProps}>
                        <IconCalendar size={18} />
                    </ThemeIcon>
                    <Text {...textProps}>
                        {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                    </Text>
                </Group> */}

                <Group spacing="xs">
                    <ThemeIcon {...iconProps}>
                        <IconCurrencyDollar size={18} />
                    </ThemeIcon>
                    <Text {...textProps}>
                        {teamDetails.signUpFee}
                    </Text>
                </Group>

                <Group spacing="xs">
                    <ThemeIcon {...iconProps}>
                        <IconFriends size={18} />
                    </ThemeIcon>
                    <Text {...textProps}>
                        {teamDetails.genderMix}
                    </Text>
                </Group>

                {/* <Group spacing="xs">
                    <ThemeIcon {...iconProps}>
                        <IconCalendarRepeat size={18} />
                    </ThemeIcon>
                    <Text {...textProps}>
                        {`${season.gameDays}s`}
                    </Text>
                </Group> */}
            </Stack>

            <Card mt="lg" radius="md" padding="xs">
                <PlayerList players={players} coachId={coachId} coachView={coachView} />

                {coachView && (

                    <Button
                        mt="md"
                        color={primaryColor}
                        onClick={() => setIsModalOpen(true)}
                        autoContrast
                    >
                        Add Player
                    </Button>
                )}
            </Card>

            <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add a Player">
                {error && <Alert type="error" mb="md" c="red">{error}</Alert>}
                <PlayerForm
                    setIsModalOpen={setIsModalOpen}
                    setError={setError}
                    primaryColor={primaryColor}
                />
            </Modal>
        </Container >
    );
};