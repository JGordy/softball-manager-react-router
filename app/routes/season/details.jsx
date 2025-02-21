import { useState } from 'react';

import { Container, Group, Title } from '@mantine/core';

import BackButton from '@/components/BackButton';
import EditButton from '@/components/EditButton';
import { getSeasonDetails } from './loader';

export async function loader({ params }) {
    const { seasonId } = params;

    return getSeasonDetails({ seasonId });
}

export default function SeasonDetails({ loaderData }) {
    const { season } = loaderData;
    console.log('/season/details.jsx: ', { season });

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleEditSeasonDetails = () => {
        setIsModalOpen(true)
    };

    return (
        <Container size="xl" p="xl">
            <Group justify="space-between">
                <BackButton text="Teams" />
                <EditButton setIsModalOpen={handleEditSeasonDetails} />
            </Group>
            <Title order={2} align="center" mt="sm" mb="lg">
                {season.seasonName}
            </Title>
            <p>{season.games.length} games listed</p>
        </Container>
    );
}