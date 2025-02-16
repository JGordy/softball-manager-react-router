import React from 'react';
import {
    Avatar,
    Card,
    ColorSwatch,
    Divider,
    Group,
    Image,
    Title,
} from '@mantine/core';

import styles from '@/styles/positionChart.module.css';

const fieldPositions = {
    Pitcher: { initials: 'P' },
    Catcher: { initials: 'C' },
    'First Base': { initials: '1B' },
    'Second Base': { initials: '2B' },
    'Third Base': { initials: '3B' },
    'Shortstop': { initials: 'SS' },
    'Left Field': { initials: 'LF' },
    'Left Center Field': { initials: 'LC' },
    'Right Center Field': { initials: 'RC' },
    'Right Field': { initials: 'RF' },
};

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

function PlayerDetails({ preferredPositions, dislikedPositions, editButton }) {

    return (
        <Card shadow="sm" py="lg" px="xs" radius="xl" mt="md" withBorder>
            <Group justify="space-between" px="10px">
                <Title order={4}>Player Details</Title>
                {editButton}
            </Group>

            <Divider my="sm" size="sm" />

            <Title order={5} pl="10px">Fielding Chart</Title>

            <div className={styles.imageContainer}>
                <Image src={fieldSrc} alt="Preferred Positions Chart" />

                {Object.keys(fieldPositions).map((position) => {
                    const { initials } = fieldPositions[position];
                    return (
                        <FieldPosition
                            key={position}
                            position={position}
                            isPreferred={preferredPositions.includes(position)}
                            isDisliked={dislikedPositions.includes(position)}
                            initials={initials}
                        />
                    );
                })}
            </div>
            <Group justify='space-between' px="10px">
                <Group gap="xs">
                    <ColorSwatch color={colors.PREFERRED} />
                    Preferred
                </Group>
                <Group gap="xs">
                    <ColorSwatch color={colors.NEUTRAL} />
                    Open
                </Group>
                <Group gap="xs">
                    <ColorSwatch color={colors.DISLIKED} />
                    Disliked
                </Group>
            </Group>
        </Card>
    );
}

export default PlayerDetails;