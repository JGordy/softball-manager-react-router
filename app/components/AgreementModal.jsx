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
                        <strong>Participant:</strong>{" "}
                        {user?.name || "Participant"} <br />
                        <strong>Developer:</strong> Joseph Gordy <br />
                        <br />
                        <strong>Beta Purpose:</strong> You acknowledge that the
                        app is in "Beta." It may contain bugs, errors, or data
                        inconsistencies. It is provided "As-Is." <br />
                        <br />
                        <strong>Feedback:</strong> In exchange for free access,
                        you agree to provide occasional feedback on features and
                        usability. <br />
                        <br />
                        <strong>Data Privacy:</strong> We will use your team’s
                        data (lineups, rosters) only to improve the app. We
                        won't sell your data to third parties. <br />
                        <br />
                        <strong>No Warranty:</strong> The Developer is not
                        responsible for any lost games, incorrect stats, or
                        "dugout drama" caused by app errors. <br />
                        <br />
                        <strong>Termination:</strong> Either party can stop the
                        beta test at any time.
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
                        <strong>Data We Collect:</strong> We collect user emails
                        for login and team roster data (names, positions) to
                        generate your lineups. <br />
                        <br />
                        <strong>How We Use It:</strong> To provide the core
                        functionality of the app and to communicate beta
                        updates. <br />
                        <br />
                        <strong>Third Parties:</strong> We use Google Firebase
                        for data storage and the Google Gemini API for automated
                        lineup suggestions and other AI features. Your data is
                        processed securely through these providers. <br />
                        <br />
                        <strong>Your Rights:</strong> You can request to have
                        your data deleted at any time by contacting
                        support@rostrhq.app.
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
