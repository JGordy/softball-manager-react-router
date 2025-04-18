import React from 'react';
import {
    Avatar,
    Card,
    ColorSwatch,
    Divider,
    Group,
    Image,
    Text,
    Title,
} from '@mantine/core';

import fieldPositions from '@/constants/positions';

import styles from '@/styles/positionChart.module.css';

const fieldSrc = `${import.meta.env.VITE_APPWRITE_HOST_URL}/storage/buckets/67af948b00375c741493/files/67b00f90002a66960ba4/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}&mode=admin`;

const colors = {
    PREFERRED: 'rgba(0, 249, 50, 0.5)',
    NEUTRAL: 'rgba(208, 210, 209, 0.5)',
    DISLIKED: 'rgba(249, 0, 0, 0.5)',
};

function FieldPosition({ position, initials, isPreferred, isDisliked }) {
    let color = colors.NEUTRAL;

    if (isDisliked) color = colors.DISLIKED;
    if (isPreferred) color = colors.PREFERRED;

    return (
        <div
            className={`${styles.fieldingPosition} ${styles[position.toLowerCase().replace(/\s+/g, '')]}`}
        >
            <Avatar
                size="sm"
                name={initials}
                alt={position}
                variant="filled"
                color={color}
                autoContrast
            />
        </div>
    );
}

function PlayerDetails({ player, editButton }) {
    const { throws, bats, preferredPositions, dislikedPositions } = player;

    return (
        <Card shadow="sm" padding="lg" radius="lg" mt="md" withBorder>
            <Group justify="space-between">
                <Title order={4}>Player Details</Title>
                {editButton}
            </Group>

            <Group gap="xl">
                <Group gap="4px">
                    <Text>Throws</Text>
                    <Text fw={700} c={throws ? 'green' : 'red'}>{throws || "Not Listed"}</Text>
                </Group>
                <Group gap="4px">
                    <Text>Bats</Text>
                    <Text fw={700} c={bats ? 'green' : 'red'}>{bats || "Not Listed"}</Text>
                </Group>
            </Group>

            <Divider my="sm" size="sm" />

            <Text>Fielding Preferences</Text>

            <Group justify="space-between" mt="md">
                <Group gap="xs">
                    <ColorSwatch size={20} color={colors.PREFERRED} />
                    Preferred
                </Group>
                <Group gap="xs">
                    <ColorSwatch size={20} color={colors.NEUTRAL} />
                    Open
                </Group>
                <Group gap="xs">
                    <ColorSwatch size={20} color={colors.DISLIKED} />
                    Disliked
                </Group>
            </Group>

            <div className={styles.imageContainer}>
                <Image src={fieldSrc} alt="Preferred Positions Chart" />

                {Object.keys(fieldPositions).map((position) => (
                    <FieldPosition
                        key={position}
                        position={position}
                        isPreferred={preferredPositions.includes(position)}
                        isDisliked={dislikedPositions.includes(position)}
                        {...fieldPositions[position]}
                    />
                ))}
            </div>
        </Card>
    );
}

export default PlayerDetails;