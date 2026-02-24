import { Stack, Text, Button } from "@mantine/core";

import { trackEvent } from "@/utils/analytics";

export default function SupportPanel() {
    return (
        <Stack gap="md">
            <Text size="sm">
                Have a bug to report or feedback to share? We&apos;d love to
                hear from you.
            </Text>
            <Text size="sm">
                Please verify that you are on the latest version of the app
                before reporting issues. If you are submitting a bug report,
                please include details and screenshots if available.
            </Text>
            <div>
                <Button
                    component="a"
                    href="mailto:support@rostrhq.app"
                    onClick={() => trackEvent("email-support")}
                    variant="light"
                    radius="md"
                    justify="flex-start"
                >
                    support@rostrhq.app
                </Button>
            </div>
        </Stack>
    );
}
