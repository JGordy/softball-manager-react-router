import { Stack, Text, Anchor } from "@mantine/core";

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
            <Text size="sm" fw={500}>
                <Anchor href="mailto:support@rostrhq.app">
                    support@rostrhq.app
                </Anchor>
            </Text>
        </Stack>
    );
}
