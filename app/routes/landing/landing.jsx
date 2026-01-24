import { useLoaderData } from "react-router";
import { useMediaQuery } from "@mantine/hooks";

import { createSessionClient } from "@/utils/appwrite/server";

import { logoutAction } from "@/actions/logout";

import FeaturesSection from "./components/FeaturesSection";
import ShowcaseSection from "./components/ShowcaseSection";
import HeroSection from "./components/HeroSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

import { isMobileUserAgent } from "@/utils/device";

export async function action({ request }) {
    return logoutAction({ request });
}

export async function loader({ request }) {
    const isMobile = isMobileUserAgent(request);

    try {
        const { account } = await createSessionClient(request);
        await account.get();

        return { isAuthenticated: true, isDesktop: !isMobile };
    } catch {
        return { isAuthenticated: false, isDesktop: !isMobile };
    }
}

export default function Landing() {
    const { isAuthenticated, isDesktop } = useLoaderData();
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

            <CTASection
                isAuthenticated={isAuthenticated}
                isMobileUI={isMobileUI}
            />

            <Footer />
        </div>
    );
}
