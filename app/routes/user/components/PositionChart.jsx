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

const fieldSrc = 'https://cloud.appwrite.io/v1/storage/buckets/67af948b00375c741493/files/67af94a00000296fb831/view?project=679b95f10030c4821c90&mode=admin';

const preferredColor = 'rgba(0, 249, 50, 0.5)';
const notPreferredColor = 'rgba(249, 0, 0, 0.25)';

function FieldPosition({ position, x, y, initials, isPreferred }) {
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
                color={isPreferred ? preferredColor : notPreferredColor}
                autoContrast
            />
        </div>
    );
}

function PositionChart({ preferredPositions }) {

    return (
        <Card shadow="sm" padding="lg" radius="xl" mt="md" withBorder>
            <Title order={4}>Preferred Positions</Title>
            <div style={{ position: 'relative' }}>
                <Image src={fieldSrc} alt="Preferred Positions Chart" />

                {Object.keys(fieldPositions).map((position) => {
                    const coords = fieldPositions[position];
                    if (coords) {
                        return <FieldPosition key={position} position={position} isPreferred={preferredPositions.includes(position)} {...coords} />;
                    }
                    return null; // Handle cases where position isn't defined
                })}
            </div>
            <Group justify='space-between'>
                <Group gap="xs">
                    <ColorSwatch color={preferredColor} />
                    Preferred
                </Group>
                <Group gap="xs">
                    <ColorSwatch color={notPreferredColor} />
                    Not Preferred
                </Group>
            </Group>
        </Card>
    );
}

export default PositionChart;