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

import EditButton from '@/components/EditButton';

import AddPlayer from '@/forms/AddPlayer';

import fieldPositions from '@/constants/positions';
import images from '@/constants/images';

import useModal from '@/hooks/useModal';

import styles from '@/styles/positionChart.module.css';

const { fieldSrc } = images;

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

function PlayerDetails({
    user,
    player,
    isCurrentUser,
}) {

    const {
        throws,
        bats,
        preferredPositions,
        dislikedPositions,
    } = player;

    const { openModal } = useModal();

    const openPlayerDetailsModal = () => openModal({
        title: 'Update Player Details',
        children: (
            <AddPlayer
                action="edit-player"
                actionRoute={`/user/${user.$id}`}
                confirmText="Update Details"
                inputsToDisplay={['positions', 'throws-bats']}
                defaults={player}
            />
        ),
    });

    return (
        <Card shadow="sm" padding="lg" radius="lg" mt="md" withBorder>
            <Group justify="space-between">
                <Group>
                    <Group gap="4px">
                        <Text>Throws</Text>
                        <Text fw={700} c={throws ? 'green' : 'red'}>{throws || "Not Listed"}</Text>
                    </Group>
                    <Group gap="4px">
                        <Text>Bats</Text>
                        <Text fw={700} c={bats ? 'green' : 'red'}>{bats || "Not Listed"}</Text>
                    </Group>
                </Group>
                {isCurrentUser && <EditButton setIsModalOpen={openPlayerDetailsModal} />}
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