import { Link } from 'react-router';
import {
    Card,
    Group,
    Skeleton,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import {
    IconChevronRight,
    IconCloudRain,
} from '@tabler/icons-react';

import DrawerContainer from '@/components/DrawerContainer';
import DeferredLoader from '@/components/DeferredLoader';

export default function WeatherDetails({ weatherPromise }) {

    const [weatherDrawerOpened, weatherDrawerHandlers] = useDisclosure(false);

    return (
        <>
            <Card withBorder radius="lg" mt="xl" mx="md" py="5px">

                <Text size="sm" mt="xs">Weather Details</Text>

                <Card.Section my="xs" inheritPadding>
                    <Group justify='space-between' onClick={weatherDrawerHandlers.open} c="green">
                        <Group gap="xs">
                            <IconCloudRain size={18} />
                            Gameday Forecast
                        </Group>
                        <IconChevronRight size={18} />
                    </Group>
                    <DeferredLoader
                        resolve={weatherPromise}
                        fallback={<Skeleton height={16} width="70%" mt="5px" ml="28px" radius="xl" />}
                        errorElement={<Text size="xs" mt="5px" ml="28px" c="red">Error loading weather details</Text>}
                    >
                        {(weather) => {
                            return (
                                <Text size="xs" mt="5px" ml="28px" c="dimmed">
                                    {!weather ? 'Data unavailable at this time' : 'Some weather summary here'}
                                </Text>
                            );
                        }}
                    </DeferredLoader>
                </Card.Section>
            </Card>

            <DeferredLoader resolve={weatherPromise}>
                {(weather) => {
                    return (
                        <DrawerContainer
                            opened={weatherDrawerOpened}
                            onClose={weatherDrawerHandlers.close}
                            title="Weather Details"
                            size="md"
                        >
                            {JSON.stringify(weather)}
                        </DrawerContainer>
                    );
                }}
            </DeferredLoader>
        </>
    );
};