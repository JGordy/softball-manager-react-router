import React from 'react';
import { Avatar, Image } from '@mantine/core';

const fieldPositions = {
    Pitcher: { x: 50, y: 60 },
    Catcher: { x: 50, y: 80 },
    "First Base": { x: 66, y: 56 },
    "Second Base": { x: 57, y: 49 },
    "Third Base": { x: 34, y: 56 },
    "Shortstop": { x: 43, y: 49 },
    "Left Field": { x: 25, y: 35 },
    "Left Center Field": { x: 40, y: 28 },
    "Right Center Field": { x: 60, y: 28 },
    "Right Field": { x: 75, y: 35 },
};

const fieldSrc = 'https://cloud.appwrite.io/v1/storage/buckets/67af948b00375c741493/files/67af94a00000296fb831/view?project=679b95f10030c4821c90&mode=admin';

function FieldPosition({ position, x, y }) {
    return (
        <div
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)', // Center the avatar
            }}
        >
            <Avatar
                size="sm"
                name={position}
                alt={position}
                color="white"
            />
        </div>
    );
}

function PositionChart({ preferredPositions }) {

    return (
        <div style={{ position: 'relative' }}> {/* Adjust size */}
            <Image src={fieldSrc} alt="Field" style={{ width: '100%', height: '100%' }} />

            {preferredPositions.map((position) => {
                const coords = fieldPositions[position];
                if (coords) {
                    return <FieldPosition key={position} position={position} {...coords} />;
                }
                return null; // Handle cases where position isn't defined
            })}
        </div>
    );
}

export default PositionChart;