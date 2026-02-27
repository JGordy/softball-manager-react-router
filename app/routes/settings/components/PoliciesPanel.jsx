import { useOutletContext } from "react-router";
import { Group, Button, Stack, Text, ScrollArea } from "@mantine/core";
import { IconFileDescription, IconShieldLock } from "@tabler/icons-react";
import useModal from "@/hooks/useModal";
import {
    BETA_AGREEMENT_CONTENT,
    PRIVACY_POLICY_CONTENT,
} from "@/constants/agreements";

export default function PoliciesPanel() {
    const { user } = useOutletContext();
    const { openModal } = useModal();

    const openBetaAgreement = () => {
        openModal({
            title: "Beta User Agreement",
            size: "lg",
            centered: true,
            children: (
                <ScrollArea h={400} offsetScrollbars>
                    <Stack gap="md">
                        <Text size="sm">{BETA_AGREEMENT_CONTENT(user)}</Text>
                    </Stack>
                </ScrollArea>
            ),
        });
    };

    const openPrivacyPolicy = () => {
        openModal({
            title: "Privacy Policy for Rostrhq.app",
            size: "lg",
            centered: true,
            children: (
                <ScrollArea h={400} offsetScrollbars>
                    <Stack gap="md">
                        <Text size="sm">{PRIVACY_POLICY_CONTENT}</Text>
                    </Stack>
                </ScrollArea>
            ),
        });
    };

    return (
        <Stack gap="md" py="sm">
            <Text size="sm" c="dimmed">
                Review our latest terms and policies that govern the use of the
                app.
            </Text>

            <Group>
                <Button
                    variant="light"
                    leftSection={<IconFileDescription size={16} />}
                    onClick={openBetaAgreement}
                    color="lime"
                >
                    View Beta User Agreement
                </Button>
                <Button
                    variant="light"
                    leftSection={<IconShieldLock size={16} />}
                    onClick={openPrivacyPolicy}
                    color="lime"
                >
                    View Privacy Policy
                </Button>
            </Group>
        </Stack>
    );
}
