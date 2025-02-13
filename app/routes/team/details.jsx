
import { useState, useEffect } from 'react';

import {
    Alert,
    Button,
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

import { listDocuments, readDocument } from '@/utils/databases';
import { adjustColorBasedOnDarkness } from '@/utils/adjustHexColor';

import { Query } from '@/appwrite';

import PlayerForm from './components/PlayerForm';
import PlayerList from './components/PlayerList';

import { createPlayer } from '../user/action';

export async function action({ request, params }) {
    return createPlayer({ request, params });
};

export async function loader({ params }) {
    const { teamId } = params;

    if (teamId) {
        const memberships = await listDocuments('memberships', [
            Query.equal('teamId', teamId),
        ]);

        // 2. Extract teamIds
        const userIds = memberships.documents.map(m => m.userId);

        let players = [];
        if (userIds.length > 0) {
            // Make multiple queries
            const promises = userIds.map(async (userId) => {
                const result = await listDocuments('users', [
                    Query.equal('$id', userId),
                ]);
                return result.documents;
            });

            const results = await Promise.all(promises);
            players = results.flat();
        }

        return {
            teamData: await readDocument('teams', teamId),
            players,
        };
    } else {
        return { teamData: {} };
    }
};

export default function TeamDetails({ actionData, loaderData }) {
    const { teamData, players } = loaderData;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamDetails, setTeamDetails] = useState(teamData || {});
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleAfterSubmit = async () => {
            console.log('Does this even work?', { actionData });
            try {
                if (actionData && actionData.status === 200) {
                    // const { response } = actionData;

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
        // autoContrast: true,
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
                <Group spacing="xs">
                    <ThemeIcon {...iconProps}>
                        <IconMapPin size={18} />
                    </ThemeIcon>
                    <Text {...textProps}>
                        {teamDetails.location || "Location not specified"}
                    </Text>
                </Group>

                <Group spacing="xs">
                    <ThemeIcon {...iconProps}>
                        <IconCalendar size={18} />
                    </ThemeIcon>
                    <Text {...textProps}>
                        {new Date(teamDetails.seasonStartDate).toLocaleDateString()} - {new Date(teamDetails.seasonEndDate).toLocaleDateString()}
                    </Text>
                </Group>

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

                <Group spacing="xs">
                    <ThemeIcon {...iconProps}>
                        <IconCalendarRepeat size={18} />
                    </ThemeIcon>
                    <Text {...textProps}>
                        {`${teamDetails.gameDays}s`}
                    </Text>
                </Group>
            </Stack>

            <PlayerList players={players} />

            <Button
                mt="md"
                color={primaryColor}
                onClick={() => setIsModalOpen(true)}
                autoContrast
            >
                Add Player
            </Button>

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