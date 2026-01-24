import { Anchor, Container, Text } from "@mantine/core";
import branding from "@/constants/branding";

export default function Footer() {
    return (
        <Container py="xl" ta="center">
            <Text c="dimmed" size="sm">
                © {new Date().getFullYear()} {branding.name}. All rights
                reserved.
            </Text>
            <Text c="dimmed" size="sm" mt={4}>
                <Anchor
                    href="https://github.com/JGordy/softball-manager-react-router"
                    target="_blank"
                >
                    View on GitHub
                </Anchor>
            </Text>
        </Container>
    );
}
