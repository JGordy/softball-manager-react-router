import { useState, useEffect } from "react";

/**
 * Hook to handle PWA installation.
 * Captures the 'beforeinstallprompt' event and exposes a method to trigger the install prompt.
 *
 * @returns {{ isInstallable: boolean, promptInstall: () => Promise<string | null> }}
 */
export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsInstallable(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) {
            return null;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        // userChoice is a promise that resolves to { outcome: 'accepted' | 'dismissed', platform: string }
        const { outcome } = await deferredPrompt.userChoice;

        // We've used the prompt, and can't use it again, discard it
        setDeferredPrompt(null);
        setIsInstallable(false);

        return outcome;
    };

    return { isInstallable, promptInstall };
}
