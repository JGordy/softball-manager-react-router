import { Form, Link } from "react-router";
import {
    Button,
    Container,
    Flex,
    Group,
    Stack,
    Text,
    Title,
    rem,
} from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import branding from "@/constants/branding";

export default function HeroSection({ isAuthenticated, isDesktop }) {
    const isMobile = !isDesktop;

    return (
        <div
            style={{
                background:
                    "linear-gradient(135deg, var(--mantine-color-green-9) 0%, var(--mantine-color-green-7) 100%)",
                color: "white",
                padding: `${rem(120)} 0 ${rem(160)}`,
                textAlign: "center",
                borderBottomRightRadius: "50% 40px",
                borderBottomLeftRadius: "50% 40px",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Abstract Background Shapes */}
            <div
                style={{
                    position: "absolute",
                    top: -100,
                    left: -100,
                    width: 400,
                    height: 400,
                    background:
                        "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
                    borderRadius: "50%",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: -50,
                    right: -50,
                    width: 300,
                    height: 300,
                    background:
                        "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
                    borderRadius: "50%",
                }}
            />

            <Container size="md" style={{ position: "relative", zIndex: 1 }}>
                <Title
                    order={1}
                    style={{
                        fontSize: rem(64),
                        fontWeight: 900,
                        lineHeight: 1.1,
                        letterSpacing: -1,
                    }}
                >
                    {branding.name}
                </Title>
                <Text
                    size="xl"
                    mt="xl"
                    opacity={0.9}
                    style={{
                        maxWidth: 600,
                        margin: "auto",
                        fontSize: rem(24),
                    }}
                >
                    {branding.tagline}
                </Text>

                <Group justify="center" mt={50} w="100%">
                    {isAuthenticated ? (
                        <Stack
                            gap="sm"
                            w={isMobile ? "100%" : "auto"}
                            maw={400}
                            mx="auto"
                        >
                            <Text
                                c="white"
                                fw={500}
                                bg="rgba(0,0,0,0.2)"
                                px="lg"
                                py={4}
                                style={{ borderRadius: 20 }}
                            >
                                {isDesktop
                                    ? "You are logged in. Please switch to your phone to access the dashboard."
                                    : "You are currently logged in."}
                            </Text>
                            <Flex
                                direction={isMobile ? "column" : "row"}
                                gap="sm"
                                w="100%"
                            >
                                {!isDesktop && (
                                    <Button
                                        component={Link}
                                        to="/"
                                        size="xl"
                                        variant="white"
                                        color="dark"
                                        radius="xl"
                                        fullWidth={isMobile}
                                        rightSection={
                                            <IconArrowRight size={20} />
                                        }
                                    >
                                        Go to Dashboard
                                    </Button>
                                )}
                                <Form
                                    method="post"
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "center",
                                    }}
                                >
                                    {isDesktop ? (
                                        <Button
                                            type="submit"
                                            variant="subtle"
                                            color="gray.0"
                                            size="compact-sm"
                                            style={{
                                                textDecoration: "underline",
                                                opacity: 0.8,
                                            }}
                                        >
                                            Log out
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            size="xl"
                                            variant="outline"
                                            color="white"
                                            radius="xl"
                                            fullWidth
                                            style={{
                                                color: "white",
                                                borderColor:
                                                    "rgba(255,255,255,0.4)",
                                            }}
                                        >
                                            Log out
                                        </Button>
                                    )}
                                </Form>
                            </Flex>
                        </Stack>
                    ) : (
                        <Button
                            component={Link}
                            to="/login"
                            size="xl"
                            variant="white"
                            color="dark"
                            radius="xl"
                            fullWidth={isMobile}
                            rightSection={<IconArrowRight size={20} />}
                        >
                            Get Started
                        </Button>
                    )}
                </Group>
            </Container>
        </div>
    );
}
