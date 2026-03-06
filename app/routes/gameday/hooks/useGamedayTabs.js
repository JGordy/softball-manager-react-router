import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

/**
 * Custom hook to manage Gameday tab navigation and URL hash syncing.
 * Normalizes 'live' tab for desktop and handles gameFinal transitions.
 */
export function useGamedayTabs({ gameFinal = false, isDesktop = false }) {
    const location = useLocation();
    const navigate = useNavigate();

    // Helper to get the initial tab based on hash, game status, and platform
    const getInitialTab = useCallback(() => {
        const hash = location?.hash?.replace(/^#/, "") || null;
        const validTabs = ["live", "plays", "boxscore", "spray"];

        let normalizedHash = hash;
        if (isDesktop && hash === "live") {
            normalizedHash = "boxscore";
        }

        if (normalizedHash && validTabs.includes(normalizedHash)) {
            if (gameFinal && normalizedHash === "live") return "plays";
            return normalizedHash;
        }

        // Default fallbacks
        if (gameFinal) return "plays";
        if (isDesktop) return "boxscore";
        return "live";
    }, [location.hash, gameFinal, isDesktop]);

    const [activeTab, setActiveTab] = useState(() => getInitialTab());

    // Update URL hash when tab changes
    const handleTabChange = useCallback(
        (value) => {
            if (!value || value === activeTab) return;

            let normalizedValue = value;
            if (isDesktop && value === "live") {
                normalizedValue = "boxscore";
            }

            setActiveTab(normalizedValue);

            const newHash = `#${normalizedValue}`;
            const url = `${location.pathname}${location.search}${newHash}`;
            navigate(url, { replace: false });
        },
        [activeTab, location.pathname, location.search, navigate, isDesktop],
    );

    // Sync activeTab with gameFinal status (e.g., if game becomes final while viewing 'live')
    useEffect(() => {
        if (gameFinal && activeTab === "live") {
            const nextTab = "plays";
            setActiveTab(nextTab);
            const newHash = `#${nextTab}`;
            const url = `${location.pathname}${location.search}${newHash}`;
            navigate(url, { replace: false });
        }
    }, [gameFinal, activeTab, location.pathname, location.search, navigate]);

    // Keep tab state in sync when location.hash changes (back/forward navigation)
    useEffect(() => {
        const hash = location?.hash?.replace(/^#/, "") || null;
        const validTabs = ["live", "plays", "boxscore", "spray"];

        let normalizedHash = hash;
        if (isDesktop && hash === "live") {
            normalizedHash = "boxscore";
        }

        if (normalizedHash === "live" && gameFinal) {
            return;
        }

        if (normalizedHash && validTabs.includes(normalizedHash)) {
            setActiveTab(normalizedHash);
        }
    }, [location.hash, gameFinal, isDesktop]);

    return {
        activeTab,
        handleTabChange,
        setActiveTab,
    };
}
