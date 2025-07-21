import {
    Anchor,
    Card,
    // Divider,
    Flex,
    Group,
    Text,
} from '@mantine/core';
import { useOs } from '@mantine/hooks';

import {
    IconBrandApple,
    IconBrandGoogleFilled,
    IconBrandOffice,
    IconBrandWindowsFilled,
    IconCalendarPlus,
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
    console.log({ game, park, team });

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

    const parsedDate = new Date(gameDate);

    const gameDateTime = {
        date: parsedDate.toISOString().slice(0, 10),
        startTime: parsedDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone,
        }),
        dayOfWeek: parsedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            timeZone,
        }),
        month: parsedDate.toLocaleDateString('en-US', {
            month: 'long',
            timeZone,
        }),
    };

    console.log({ gameDateTime });

    const event = {
        title: `${team?.name} ${isHomeGame ? 'vs' : '@'} ${opponent || "TBD"}`,
        location: park?.formattedAddress || location || '',
        start: gameDate,
        duration: [1, 'hour'],
        timeZone: timeZone,
    };

    return (
        <>
            <Flex align="center" gap="md" mb="xl">
                <div>
                    <IconCalendarPlus size={20} />
                </div>
                {/* <Divider orientation="vertical" size="sm" /> */}
                <div>
                    <Text size="lg" weight={700}>
                        {gameDateTime.startTime}
                    </Text>
                    <Text size="sm">
                        {gameDateTime.dayOfWeek}, {gameDateTime.month} {gameDateTime.date}
                    </Text>
                </div>
            </Flex>

            <Group mt="md" justify='space-between'>
                {calendarOrder().map((key, index) => {
                    const { href, icon, label } = calendarMap[key];
                    const isFirstItem = index === 0;

                    return (
                        <Anchor
                            key={key}
                            href={href(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            miw={isFirstItem ? '100%' : ''}
                        >
                            <Card c="green">
                                <Group gap="5px" justify='center' mr={isFirstItem ? '10px' : ''}>
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