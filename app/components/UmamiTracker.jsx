import { useEffect } from "react";
import { useLocation, useMatches } from "react-router";

/**
 * Validates if the Umami instance is available on the window object
 */
const isUmamiAvailable = () => {
    return (
        typeof window !== "undefined" &&
        window.umami &&
        typeof window.umami.track === "function"
    );
};

export const UmamiTracker = () => {
    const location = useLocation();
    const matches = useMatches();

    useEffect(() => {
        // If Umami isn't loaded yet, it might need a moment or the script failed
        // For the very first load, the script might be racing with hydration
        // But since we use useLocation, this effect runs on route change

        const trackPageView = () => {
            if (!isUmamiAvailable()) return;

            try {
                // Collect all params from active matches
                const allParams = matches.reduce((acc, match) => {
                    return { ...acc, ...match.params };
                }, {});

                let url = location.pathname;

                // Replace dynamic ID params with generic placeholders (e.g. /team/123 -> /team/:teamId)
                // Sorting by length handles potential nested substring issues
                const paramsToReplace = Object.entries(allParams)
                    .filter(([_, value]) => value) // Ensure value exists
                    .sort((a, b) => b[1].length - a[1].length);

                paramsToReplace.forEach(([key, value]) => {
                    // Global replacement to catch all instances in path
                    url = url.replaceAll(value, `:${key}`);
                });

                // Track with the sanitized URL and attach params as metadata
                // This groups the page in "Pages" (e.g. /team/:teamId)
                // but keeps the specific data in the properties
                window.umami.track({ url, ...allParams });

                // Fire specific events for high-value entities
                // This creates "Top Teams" / "Top Users" lists in the Events tab
                if (allParams.teamId) {
                    window.umami.track("view_team", {
                        teamId: allParams.teamId,
                    });
                }
                if (allParams.userId) {
                    window.umami.track("view_user", {
                        userId: allParams.userId,
                    });
                }
                if (allParams.seasonId) {
                    window.umami.track("view_season", {
                        seasonId: allParams.seasonId,
                    });
                }
                if (allParams.eventId) {
                    // events can be games, practices, etc.
                    window.umami.track("view_event", {
                        eventId: allParams.eventId,
                    });
                }
            } catch (error) {
                console.error("Umami tracking failed:", error);
            }
        };

        // Attempt validation
        if (isUmamiAvailable()) {
            trackPageView();
        } else {
            let timeoutId;

            // Fallback/Retry for initial load race condition
            const intervalId = setInterval(() => {
                if (isUmamiAvailable()) {
                    trackPageView();
                    clearInterval(intervalId);
                    clearTimeout(timeoutId);
                }
            }, 500);

            // Timeout after 5s to avoid infinite interval
            timeoutId = setTimeout(() => {
                clearInterval(intervalId);
            }, 5000);

            return () => {
                clearInterval(intervalId);
                clearTimeout(timeoutId);
            };
        }
    }, [location.pathname, matches]); // Re-run when path or route matches change

    return null;
};
