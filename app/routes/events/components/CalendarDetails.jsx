import {
    Anchor,
    Card,
    Group,
    Text,
} from '@mantine/core';
import { useOs } from '@mantine/hooks';

import {
    IconBrandApple,
    IconBrandGoogleFilled,
    IconBrandOffice,
    IconBrandWindowsFilled,
} from '@tabler/icons-react';

import { google, ics, outlook, office365 } from "calendar-link";

const calendarMap = {
    google: {
        href: google,
        icon: <IconBrandGoogleFilled size={18} />,
        label: 'Google',
    },
    apple: {
        href: ics,
        icon: <IconBrandApple size={18} />,
        label: 'Apple',
    },
    outlook: {
        href: outlook,
        icon: <IconBrandWindowsFilled size={18} />,
        label: 'Outlook',
    },
    office365: {
        href: office365,
        icon: <IconBrandOffice size={18} />,
        label: 'Office',
    },
};

export default function CalendarDetails({ game, park, team }) {

    const os = useOs();
    const isGoogle = ['android', 'chromeos'].includes(os);
    const isApple = ['ios', 'macos'].includes(os);
    const isMicrosoft = ['windows'].includes(os);

    const calendarOrder = () => {
        if (isGoogle) return ['google', 'apple', 'outlook', 'office365'];
        if (isApple) return ['apple', 'google', 'outlook', 'office365'];
        if (isMicrosoft) return ['outlook', 'office365', 'google', 'apple'];
        return ['google', 'apple', 'outlook', 'office365'];
    };

    const {
        isHomeGame,
        opponent,
        gameDate,
        location,
        timeZone,
    } = game;

    const event = {
        title: `${team?.name} ${isHomeGame ? 'vs' : '@'} ${opponent || "TBD"}`,
        location: park?.formattedAddress || location || '',
        start: gameDate,
        duration: [1, 'hour'],
        timeZone: timeZone,
    }

    return (
        <>
            <div>Add game to calendar</div>
            <Group gap="xs" mt="md" justify='space-between'>
                {calendarOrder().map((key, index) => {
                    const { href, icon, label } = calendarMap[key];
                    const isFirstItem = index === 0;

                    return (
                        <Anchor
                            key={key}
                            href={href(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            w={isFirstItem ? '100%' : 'auto'}
                        >
                            <Card c="green">
                                <Group gap="xs" justify='center' mr={isFirstItem ? '10px' : ''}>
                                    {icon}
                                    <Text>{label}</Text>
                                </Group>
                            </Card>
                        </Anchor>
                    );
                })}
            </Group>
        </>
    );
};