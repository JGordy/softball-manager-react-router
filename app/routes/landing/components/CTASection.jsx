import { Link } from "react-router";
import { Button, Container, Paper, Text, Title, rem } from "@mantine/core";

export default function CTASection({ isAuthenticated, isMobileUI }) {
    return (
        <Container size="lg" pb={100}>
            <Paper
                radius="md"
                p={rem(60)}
                withBorder
                style={{
                    background:
                        "linear-gradient(135deg, var(--mantine-color-green-9) 0%, var(--mantine-color-green-8) 100%)",
                    color: "white",
                    textAlign: "center",
                }}
            >
                <Title order={2} fz={rem(36)} mb="md">
                    Ready to take the field?
                </Title>
                <Text mb="xl" opacity={0.8} maw={600} mx="auto" size="lg">
                    Simplify your softball management. Join us in building the
                    ultimate toolbox for managers and players.
                </Text>
                {!isAuthenticated && (
                    <Button
                        component={Link}
                        to="/login"
                        size="xl"
                        variant="white"
                        color="dark"
                        radius="xl"
                        fullWidth={isMobileUI}
                    >
                        Get Started Now
                    </Button>
                )}
            </Paper>
        </Container>
    );
}
