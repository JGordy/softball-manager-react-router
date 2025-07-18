import {
    Anchor,
    Card,
    Flex,
    Group,
    Text,
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';

import {
    IconMapPin,
    IconLocationFilled,
    IconCopy,
} from '@tabler/icons-react';

export default function ParkDetailsDrawer({ park }) {

    const clipboard = useClipboard({ timeout: 500 });

    return (
        <>
            <Flex align="center" gap="md" mb="xl">
                <div>
                    <IconMapPin size={20} />
                </div>
                <div>
                    <Text size="lg" weight={500}>
                        {park?.displayName}
                    </Text>
                    <Text size="sm">
                        {park?.formattedAddress}
                    </Text>
                </div>
            </Flex>

            <Anchor
                href={park?.googleMapsURI}
                target="_blank"
                rel="noopener noreferrer"
            >
                <Card c="green">
                    <Group gap="xs">
                        <IconLocationFilled size={18} />
                        <Text>View on Google Maps</Text>
                    </Group>
                </Card>
            </Anchor>

            <Card
                c="green"
                mt="md"
                onClick={() => clipboard.copy(park?.formattedAddress)}
            >
                <Group gap="xs">
                    <IconCopy size={18} />
                    <Text>{clipboard.copied ? 'Copied!' : 'Copy Address'}</Text>
                </Group>
            </Card>
        </>
    );
}