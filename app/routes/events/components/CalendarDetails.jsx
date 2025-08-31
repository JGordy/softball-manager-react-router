import {
    Button,
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

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    };

    const gameStartTime = parsedDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone,
    });

    const event = {
        title: `${team?.name} ${isHomeGame ? 'vs' : '@'} ${opponent || "TBD"}`,
        location: park?.formattedAddress || location || '',
        start: gameDate,
        duration: [1, 'hour'],
        timeZone: timeZone,
    };

    const [firstkey, ...items] = calendarOrder();
    const firstItem = calendarMap[firstkey];

    return (
        <>
            <Flex align="center" gap="md" mb="xl">
                <div>
                    <IconCalendarPlus size={20} />
                </div>
                <div>
                    <Text size="lg" weight={700}>
                        {gameStartTime}
                    </Text>
                    <Text size="sm">
                        {parsedDate.toLocaleDateString('en-US', options)}
                    </Text>
                </div>
            </Flex>

            <Button
                variant="filled"
                component="a"
                href={firstItem.href(event)}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                fullWidth
            >
                <Group gap="md" justify='center' mr="10px">
                    {firstItem.icon}
                    <Text>{firstItem.label}</Text>
                </Group>
            </Button>

            <Group mt="md" justify='space-between' grow>
                {items.map((key) => {
                    const { href, icon, label } = calendarMap[key];

                    return (
                        <Button
                            key={key}
                            size="lg"
                            px="0px"
                            component="a"
                            href={href(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outline"
                        >
                            <Group gap="5px" justify="center" wrap="nowrap">
                                {icon}
                                <Text>{label}</Text>
                            </Group>
                        </Button>
                    );
                })}
            </Group>
        </>
    );
};