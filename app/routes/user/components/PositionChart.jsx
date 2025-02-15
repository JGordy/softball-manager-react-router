import React from 'react';
import {
    Avatar,
    Card,
    ColorSwatch,
    Group,
    Image,
    Title,
} from '@mantine/core';

const fieldPositions = {
    Pitcher: { x: 50, y: 62, initials: 'P' },
    Catcher: { x: 50, y: 78, initials: 'C' },
    'First Base': { x: 66, y: 56, initials: '1B' },
    'Second Base': { x: 57, y: 49, initials: '2B' },
    'Third Base': { x: 34, y: 56, initials: '3B' },
    'Shortstop': { x: 43, y: 49, initials: 'SS' },
    'Left Field': { x: 25, y: 35, initials: 'LF' },
    'Left Center Field': { x: 40, y: 25, initials: 'LC' },
    'Right Center Field': { x: 60, y: 25, initials: 'RC' },
    'Right Field': { x: 75, y: 35, initials: 'RF' },
};

const fieldSrc = `${import.meta.env.VITE_APPWRITE_HOST_URL}/storage/buckets/67af948b00375c741493/files/67b00f90002a66960ba4/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}&mode=admin`;

const colors = {
    PREFERRED: 'rgba(0, 249, 50, 0.5)',
    NEUTRAL: 'rgba(208, 210, 209, 0.5)',
    DISLIKED: 'rgba(249, 0, 0, 0.5)',
};

function FieldPosition({ position, x, y, initials, isPreferred, isDisliked }) {
    let color = colors.NEUTRAL;

    if (isDisliked) color = colors.DISLIKED;
    if (isPreferred) color = colors.PREFERRED;

    return (
        <div
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)', // Centers the avatar
            }}
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

function PositionChart({ preferredPositions, dislikedPositions, editButton }) {

    return (
        <Card shadow="sm" padding="lg" radius="xl" mt="md" withBorder>
            <Group justify="space-between">
                <Title order={4}>Fielding Chart</Title>
                {editButton}
            </Group>
            <div style={{ position: 'relative', minHeight: '338px' }}>
                <Image src={fieldSrc} alt="Preferred Positions Chart" />

                {Object.keys(fieldPositions).map((position) => {
                    const coords = fieldPositions[position];
                    if (coords) {
                        return (
                            <FieldPosition
                                key={position}
                                position={position}
                                isPreferred={preferredPositions.includes(position)}
                                isDisliked={dislikedPositions.includes(position)}
                                {...coords}
                            />
                        );
                    }
                    return null; // Handle cases where position isn't defined
                })}
            </div>
            <Group justify='space-between'>
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

export default PositionChart;