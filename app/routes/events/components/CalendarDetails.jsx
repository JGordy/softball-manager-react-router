import { Anchor, Card, Group, Text } from '@mantine/core';
import { IconLocationFilled } from '@tabler/icons-react';

import { google, ics, outlook, office365 } from "calendar-link";

const calendarMap = {
    'Google': google,
    'Apple': ics,
    'Outlook': outlook,
    'Office 365': office365,
};

export default function CalendarDetails({ game, park, team }) {
    console.log({ game });
    const {
        isHomeGame,
        opponent,
        gameDate,
        timeZone,
    } = game;

    const event = {
        title: `${team?.name} ${isHomeGame ? 'vs' : '@'} ${opponent || "TBD"}`,
        location: park?.formattedAddress || '',
        start: gameDate,
        duration: [1, 'hour'],
        timeZone: timeZone,
    }

    return (
        <>
            <div>Add game to calendar</div>
            {['Google', 'Apple', 'Outlook', 'Office 365'].map((key) => (
                <Anchor
                    href={calendarMap[key](event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    mb="md"
                    key={key}
                >
                    <Card c="green" mb="md">
                        <Group gap="xs">
                            <IconLocationFilled size={18} />
                            <Text>{key}</Text>
                        </Group>
                    </Card>
                </Anchor>
            ))}
        </>
    );
};