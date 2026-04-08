import { useEffect } from "react";

/**
 * Hook to force a desktop-only view element to stay visible during browser print.
 * Mantine's visibleFrom="lg" normally sets display:none during print as the
 * viewport is treated as narrow.
 */
export function usePrintVisibility() {
    useEffect(() => {
        const show = () => {
            const el = document.querySelector("[data-desktop-view]");
            if (el) el.style.setProperty("display", "block", "important");
        };
        const restore = () => {
            const el = document.querySelector("[data-desktop-view]");
            if (el) el.style.removeProperty("display");
        };
        window.addEventListener("beforeprint", show);
        window.addEventListener("afterprint", restore);
        return () => {
            window.removeEventListener("beforeprint", show);
            window.removeEventListener("afterprint", restore);
        };
    }, []);
}
