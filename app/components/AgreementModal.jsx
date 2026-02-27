import { useEffect } from "react";
import { useFetcher } from "react-router";
import {
    Button,
    Text,
    Stack,
    ScrollArea,
    Title,
    Box,
    Group,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import useModal from "@/hooks/useModal";

import {
    BETA_AGREEMENT_CONTENT,
    PRIVACY_POLICY_CONTENT,
} from "@/constants/agreements";

function AgreementModalContent({ user }) {
    const fetcher = useFetcher();

    const handleAgree = () => {
        fetcher.submit(
            {},
            {
                method: "post",
                action: "/api/agreements",
            },
        );
    };

    const isSubmitting = fetcher.state !== "idle";

    useEffect(() => {
        if (fetcher.data?.success && fetcher.state === "idle") {
            modals.close("agreement-modal");
        }
    }, [fetcher.data, fetcher.state]);

    return (
        <Stack gap="md">
            <Text size="sm">
                Before you continue, please review and accept our updated Beta
                Agreement and Privacy Policy. You must agree to these terms to
                use the app.
            </Text>

            <Box>
                <Title order={4} mb="xs">
                    Beta User Agreement
                </Title>
                <ScrollArea
                    h={{ base: "25dvh", sm: 120 }}
                    type="always"
                    offsetScrollbars
                    p="sm"
                    style={{
                        border: "1px solid var(--mantine-color-default-border)",
                        borderRadius: 8,
                    }}
                >
                    <Text size="sm" c="dimmed">
                        {BETA_AGREEMENT_CONTENT(user)}
                    </Text>
                </ScrollArea>
            </Box>

            <Box>
                <Title order={4} mb="xs">
                    Privacy Policy for Rostrhq.app
                </Title>
                <ScrollArea
                    h={{ base: "25dvh", sm: 120 }}
                    type="always"
                    offsetScrollbars
                    p="sm"
                    style={{
                        border: "1px solid var(--mantine-color-default-border)",
                        borderRadius: 8,
                    }}
                >
                    <Text size="sm" c="dimmed">
                        {PRIVACY_POLICY_CONTENT}
                    </Text>
                </ScrollArea>
            </Box>

            <Group justify="flex-end" mt="md">
                <Button
                    onClick={handleAgree}
                    loading={isSubmitting}
                    color="lime"
                >
                    I Agree to Terms & Policies
                </Button>
            </Group>
        </Stack>
    );
}

export default function AgreementModal({ user }) {
    const { openModal } = useModal();
    const agreedToTerms = user?.agreedToTerms === true;

    useEffect(() => {
        if (user && !agreedToTerms) {
            openModal({
                modalId: "agreement-modal",
                title: "App Updates & Agreements",
                size: "lg",
                centered: true,
                withCloseButton: false,
                closeOnClickOutside: false,
                closeOnEscape: false,
                children: <AgreementModalContent user={user} />,
            });
        } else {
            modals.close("agreement-modal");
        }
    }, [user, agreedToTerms, openModal]);

    return null;
}
