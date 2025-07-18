import {
    Card,
    Divider,
    Group,
} from '@mantine/core';

import {
    IconChevronRight,
    IconClock,
    IconMapPin,
} from '@tabler/icons-react';

export default function DetailsCard({
    formattedGameTime,
    park,
    season,
    locationDrawerHandlers = {},
}) {

    return (
        <Card withBorder radius="lg" mt="-12%" mx="md" py="5px">
            <Card.Section my="xs" inheritPadding>
                <Group gap="xs">
                    <IconClock size={18} />
                    {formattedGameTime}
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
            </Card.Section>
        </Card>
    );
}