import { Card, Text } from "@mantine/core";
import { IconAward } from "@tabler/icons-react";

import CardSection from "./CardSection";

export default function AwardsContainer() {
    return (
        <>
            <Card withBorder radius="xl" mt="md" mx="md" py="5px">
                <CardSection
                    // onClick={weatherDrawerHandlers.open}
                    heading="Recognition & Awards"
                    leftSection={<IconAward size={20} />}
                    subHeading={
                        <Text size="xs" mt="5px" ml="28px" c="dimmed">
                            Data unavailable at this time
                        </Text>
                    }
                />
            </Card>
        </>
    );
}
