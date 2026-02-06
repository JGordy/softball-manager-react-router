/**
 * PWA Utilities
 * Functions to detect PWA/Standalone status
 */

export const isStandalone = () => {
    if (typeof window === "undefined") return false;

    // Check for standard standalone mode (Android/Desktop)
    if (window.matchMedia("(display-mode: standalone)").matches) {
        return true;
    }

    // Check for iOS standalone mode
    if (window.navigator.standalone === true) {
        return true;
    }

    return false;
};

export const isDev = () => import.meta.env.DEV;
