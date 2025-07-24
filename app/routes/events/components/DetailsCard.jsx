import {
    Card,
    Divider,
    Group,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import {
    IconChevronRight,
    IconClock,
    IconMapPin,
} from '@tabler/icons-react';

import { formatGameTime } from '@/utils/dateTime';

import DrawerContainer from '@/components/DrawerContainer';

import ParkDetailsDrawer from './ParkDetailsDrawer';
import CalendarDetails from './CalendarDetails';

export default function DetailsCard({ game, park, season, team }) {

    const {
        gameDate,
        timeZone,
    } = game;

    const formattedGameTime = formatGameTime(gameDate, timeZone);

    const [locationDrawerOpened, locationDrawerHandlers] = useDisclosure(false);
    const [calendarDrawerOpened, calendarDrawerHandlers] = useDisclosure(false);

    return (
        <>
            <Card withBorder radius="lg" mt="-12%" mx="md" py="5px">

                <Text size="sm" mt="xs">Date & Location Details</Text>

                <Card.Section my="xs" inheritPadding>
                    <Group justify="space-between" c="green" onClick={calendarDrawerHandlers.open}>
                        <Group gap="xs" c="green">
                            <IconClock size={18} />
                            {formattedGameTime}
                        </Group>
                        <IconChevronRight size={18} />
                    </Group>
                </Card.Section>

                <Divider />

                <Card.Section my="xs" inheritPadding>
                    {park?.googleMapsURI ? (
                        <Group justify='space-between' onClick={locationDrawerHandlers.open} c="green">
                            <Group gap="xs">
                                <IconMapPin size={18} />
                                {season?.location}
                            </Group>
                            <IconChevronRight size={18} />
                        </Group>
                    ) : (
                        <Group gap="xs">
                            <IconMapPin size={18} />
                            {season?.location}
                        </Group>
                    )}
                    {park && <Text size="xs" mt="5px" ml="28px" c="dimmed">{park.formattedAddress}</Text>}
                </Card.Section>
            </Card>

            <DrawerContainer
                opened={calendarDrawerOpened}
                onClose={calendarDrawerHandlers.close}
                title="Add Game to Calendar"
            >
                <CalendarDetails
                    game={game}
                    park={park}
                    team={team}
                />
            </DrawerContainer>

            {park && (
                <DrawerContainer
                    opened={locationDrawerOpened}
                    onClose={locationDrawerHandlers.close}
                    title="Location Details"
                >
                    <ParkDetailsDrawer park={park} />
                </DrawerContainer>
            )}
        </>
    );
}