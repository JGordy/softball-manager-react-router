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
        <Card shadow="sm" py="lg" px="xs" radius="xl" mt="md" withBorder>
            <Group justify="space-between" px="10px">
                <Title order={4}>Player Details</Title>
                {editButton}
            </Group>

            <Divider my="sm" size="sm" />

            <Group gap="xl" px="xs">
                <Group gap="4px">
                    <Text>Throws</Text>
                    <Text fw={700} c={throws ? 'green' : 'red'}>{throws || "Not Specified"}</Text>
                </Group>
                <Group gap="4px">
                    <Text>Bats</Text>
                    <Text fw={700} c={bats ? 'green' : 'red'}>{bats || "Not Specified"}</Text>
                </Group>
            </Group>

            <Divider my="sm" size="sm" />

            <Text pl="10px">Fielding Preferences</Text>

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
            <Group justify='space-between' px="10px" mt="sm">
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
        </Card>
    );
}

export default PlayerDetails;