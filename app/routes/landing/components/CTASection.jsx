import { Link } from "react-router";

import { Button, Container, Paper, Text, Title, rem } from "@mantine/core";

import { trackEvent } from "@/utils/analytics";

export default function CTASection({ isAuthenticated, isDesktop }) {
    return (
        <Container size="lg" pb={100}>
            <Paper
                radius="md"
                p={rem(60)}
                withBorder
                style={{
                    background:
                        "linear-gradient(135deg, var(--mantine-color-lime-9) 0%, var(--mantine-color-lime-8) 100%)",
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
                {!isAuthenticated && !isDesktop && (
                    <Button
                        component={Link}
                        to="/login"
                        onClick={() => trackEvent("get-started")}
                        size="xl"
                        variant="white"
                        color="dark"
                        radius="xl"
                        fullWidth={!isDesktop}
                    >
                        Get Started Now
                    </Button>
                )}
            </Paper>
        </Container>
    );
}
