import { useLoaderData } from "react-router";

import { createSessionClient } from "@/utils/appwrite/server";

import { logoutAction } from "@/actions/logout";

import FeaturesSection from "./components/FeaturesSection";
import ShowcaseSection from "./components/ShowcaseSection";
import HeroSection from "./components/HeroSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

import { isMobileUserAgent } from "@/utils/device";

export const links = () => [
    { rel: "canonical", href: "https://www.rostrhq.app/landing" },
];

export const meta = () => {
    const title = "Softball Manager - Manage Your Team Like a Pro";
    const description =
        "The ultimate app for softball team management. Track stats, manage lineups, handle RSVPs, and score games in real-time.";
    const image = "/hero-desktop.jpg"; // Ensure this matches your deployment domain for best results

    return [
        { title },
        { name: "description", content: description },
        {
            name: "keywords",
            content:
                "softball, team manager, stats tracker, lineup builder, scorekeeper",
        },

        // Open Graph / Facebook
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://www.rostrhq.app/landing" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },

        // Twitter
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
    ];
};

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

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "RostrHQ",
        applicationCategory: "SportsApplication",
        operatingSystem: "Web", // Since it's a PWA/Web App
        description:
            "The ultimate app for softball team management. Track stats, manage lineups, handle RSVPs, and score games in real-time.",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
        screenshot: "https://www.rostrhq.app/scoring-dashboard.jpg",
    };

    return (
        <div
            style={{
                backgroundColor: "var(--mantine-color-gray-0)",
                minHeight: "100vh",
            }}
        >
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />

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
