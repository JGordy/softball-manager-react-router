import { useEffect, useState } from "react";

/**
 * Returns true after the component has mounted/hydrated on the client.
 * During SSR and initial client hydration, returns false so client-only
 * values (local timezone, current clock) can be deferred without mismatches.
 *
 * @returns {boolean} Whether client hydration has completed
 */
export default function useHydrated() {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    return isHydrated;
}
