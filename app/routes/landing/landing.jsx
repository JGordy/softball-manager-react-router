import { useLoaderData } from "react-router";

import { createSessionClient } from "@/utils/appwrite/server";

import { logoutAction } from "@/actions/logout";

import FeaturesSection from "./components/FeaturesSection";
import ShowcaseSection from "./components/ShowcaseSection";
import HeroSection from "./components/HeroSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

import { isMobileUserAgent } from "@/utils/device";

export async function action({ request }) {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get("redirect") || "/landing";

    return logoutAction({ request, redirectTo });
}

export async function loader({ request }) {
    const isMobile = isMobileUserAgent(request);

    try {
        const { account } = await createSessionClient(request);
        await account.get();

        return { isAuthenticated: true, isDesktop: !isMobile };
    } catch (error) {
        console.error("Landing loader authentication check failed");
        return { isAuthenticated: false, isDesktop: !isMobile };
    }
}

export default function Landing() {
    const { isAuthenticated, isDesktop } = useLoaderData();

    return (
        <div
            style={{
                backgroundColor: "var(--mantine-color-gray-0)",
                minHeight: "100vh",
            }}
        >
            <HeroSection
                isAuthenticated={isAuthenticated}
                isDesktop={isDesktop}
            />

            <FeaturesSection />

            <ShowcaseSection />

            <CTASection
                isAuthenticated={isAuthenticated}
                isDesktop={isDesktop}
            />
            <Footer />
        </div>
    );
}
