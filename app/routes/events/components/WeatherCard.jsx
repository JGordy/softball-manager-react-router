import {
    Card,
    Skeleton,
    Stack,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { IconSunset2, IconCloudRain } from '@tabler/icons-react';

import CardSection from './CardSection';
import DeferredLoader from '@/components/DeferredLoader';
import DrawerContainer from '@/components/DrawerContainer';

const weatherFallback = (
    <Stack align="center">
        <IconCloudRain size={72} />
        <Text c="red">Weather data not yet available</Text>
        <Text c="dimmed">Weather data is generally available starting seven days before the scheduled game date. Please check back at a later time.</Text>
    </Stack>
);

export default function WeatherCard({ weatherPromise }) {

    const [weatherDrawerOpened, weatherDrawerHandlers] = useDisclosure(false);

    return (
        <>
            <Card withBorder radius="xl" mt="md" mx="md" py="5px">
                <CardSection
                    onClick={weatherDrawerHandlers.open}
                    heading="Gameday Forecast"
                    leftSection={<IconSunset2 size={20} />}
                    subHeading={(
                        <DeferredLoader
                            resolve={weatherPromise}
                            fallback={<Skeleton height={16} width="70%" mt="5px" ml="28px" radius="xl" />}
                            errorElement={<Text size="xs" mt="5px" ml="28px" c="red">Error loading weather details</Text>}
                        >
                            {(weather) => {
                                console.log({ weather });
                                return (
                                    <Text size="xs" mt="5px" ml="28px" c="dimmed">
                                        {!weather ? 'Data unavailable at this time' : 'Click to view weather details'}
                                    </Text>
                                );
                            }}
                        </DeferredLoader>
                    )}
                />
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
                            {!weather ? weatherFallback : JSON.stringify(weather)}
                        </DrawerContainer>
                    );
                }}
            </DeferredLoader>
        </>
    );
}