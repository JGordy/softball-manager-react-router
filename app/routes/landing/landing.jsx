import { Link, useLoaderData, useSearchParams } from "react-router";
import { useMediaQuery } from "@mantine/hooks";

import {
    Anchor,
    Button,
    Container,
    Paper,
    Text,
    Title,
    rem,
} from "@mantine/core";

import branding from "@/constants/branding";

import { createSessionClient } from "@/utils/appwrite/server";

import { logoutAction } from "@/actions/logout";

import { FeaturesSection } from "./components/FeaturesSection";
import { ShowcaseSection } from "./components/ShowcaseSection";
import { HeroSection } from "./components/HeroSection";

export async function action({ request }) {
    return logoutAction({ request });
}

export async function loader({ request }) {
    try {
        const { account } = await createSessionClient(request);
        await account.get();
        return { isAuthenticated: true };
    } catch {
        return { isAuthenticated: false };
    }
}

export default function Landing() {
    const { isAuthenticated } = useLoaderData();

    const [searchParams] = useSearchParams();

    const isDesktop = searchParams.get("platform") === "desktop";
    const isMobileUI = useMediaQuery("(max-width: 48em)");

    return (
        <div
            style={{
                backgroundColor: "var(--mantine-color-gray-0)",
                minHeight: "100vh",
            }}
        >
            <HeroSection
                isAuthenticated={isAuthenticated}
                isMobileUI={isMobileUI}
                isDesktop={isDesktop}
            />

            <FeaturesSection />

            <ShowcaseSection />

            {/* CTA Section */}
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
                        Simplify your softball management. Join us in building
                        the ultimate toolbox for managers and players.
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

            {/* Footer */}
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
        </div>
    );
}
