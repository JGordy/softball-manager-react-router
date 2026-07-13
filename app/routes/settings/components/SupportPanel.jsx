import { Stack, Text, Button } from "@mantine/core";
import { IconClipboardList } from "@tabler/icons-react";

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
            <Stack gap="sm">
                <Button
                    component="a"
                    href="https://docs.google.com/forms/d/1rdlF1Cx73AOz79W5q6stVBCSUIjni6zVy-0yuhein74/viewform"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent("submit-beta-feedback")}
                    variant="filled"
                    color="grape"
                    radius="md"
                    leftSection={<IconClipboardList size={18} />}
                >
                    Share Beta Feedback
                </Button>
                <div>
                    <Button
                        component="a"
                        href="mailto:support@rostrhq.app"
                        onClick={() => trackEvent("email-support")}
                        variant="light"
                        radius="md"
                        color="gray"
                        justify="flex-start"
                    >
                        support@rostrhq.app
                    </Button>
                </div>
            </Stack>
        </Stack>
    );
}
