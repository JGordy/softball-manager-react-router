import { Text } from '@mantine/core';

export default function GamesList({ games, primaryColor }) {

    if (!games.length) {
        return (
            <Text mt="lg" align="center">
                No games currently listed for this team.
            </Text>
        );
    }

    return (
        <Text>
            Games List
        </Text>
    );
};