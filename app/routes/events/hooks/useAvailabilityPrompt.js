import { useEffect } from "react";

/**
 * Hook to automatically prompt for availability if user hasn't responded.
 */
export function useAvailabilityPrompt({
    deferredData,
    hasPromptedRef,
    currentUserId,
    onOpen,
    gameDeleted = false,
}) {
    useEffect(() => {
        if (
            gameDeleted ||
            !deferredData?.attendance ||
            hasPromptedRef.current ||
            !currentUserId
        )
            return;

        let cancelled = false;

        deferredData.attendance
            .then((result) => {
                if (cancelled) return;

                const attendance = result.rows || [];
                const userAttendance = attendance.find(
                    (a) => a.playerId === currentUserId,
                );
                if (!userAttendance || userAttendance.status === "unknown") {
                    onOpen();
                    hasPromptedRef.current = true;
                }
            })
            .catch(() => {
                // Ignore attendance load failures so they do not create
                // unhandled promise rejections from this effect.
            });

        return () => {
            cancelled = true;
        };
    }, [
        deferredData?.attendance,
        currentUserId,
        onOpen,
        gameDeleted,
        hasPromptedRef,
    ]);
}
