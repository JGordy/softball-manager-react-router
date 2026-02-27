import { useOutletContext } from "react-router";
import { Group, Button, Stack, Text, ScrollArea } from "@mantine/core";
import { IconFileDescription, IconShieldLock } from "@tabler/icons-react";
import useModal from "@/hooks/useModal";

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
                        <Text size="sm">
                            <strong>Participant:</strong>{" "}
                            {user?.name || "Participant"} <br />
                            <strong>Developer:</strong> Joseph Gordy
                        </Text>
                        <Text size="sm">
                            <strong>Beta Purpose:</strong> You acknowledge that
                            the app is in "Beta." It may contain bugs, errors,
                            or data inconsistencies. It is provided "As-Is."
                        </Text>
                        <Text size="sm">
                            <strong>Feedback:</strong> In exchange for free
                            access, you agree to provide occasional feedback on
                            features and usability.
                        </Text>
                        <Text size="sm">
                            <strong>Data Privacy:</strong> We will use your
                            team’s data (lineups, rosters) only to improve the
                            app. We won't sell your data to third parties.
                        </Text>
                        <Text size="sm">
                            <strong>No Warranty:</strong> The Developer is not
                            responsible for any lost games, incorrect stats, or
                            "dugout drama" caused by app errors.
                        </Text>
                        <Text size="sm">
                            <strong>Termination:</strong> Either party can stop
                            the beta test at any time.
                        </Text>
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
                        <Text size="sm">
                            <strong>Data We Collect:</strong> We collect user
                            emails for login and team roster data (names,
                            positions) to generate your lineups.
                        </Text>
                        <Text size="sm">
                            <strong>How We Use It:</strong> To provide the core
                            functionality of the app and to communicate beta
                            updates.
                        </Text>
                        <Text size="sm">
                            <strong>Third Parties:</strong> We use Appwrite for
                            data storage and the Google Gemini API for automated
                            lineup suggestions and other AI features. Your data
                            is processed securely through these providers.
                        </Text>
                        <Text size="sm">
                            <strong>Your Rights:</strong> You can request to
                            have your data deleted at any time by contacting
                            support@rostrhq.app.
                        </Text>
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
