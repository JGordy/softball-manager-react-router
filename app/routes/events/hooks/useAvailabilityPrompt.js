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

        deferredData.attendance.then((result) => {
            const attendance = result.rows || [];
            const userAttendance = attendance.find(
                (a) => a.userId === currentUserId,
            );
            if (!userAttendance || userAttendance.status === "unknown") {
                onOpen();
                hasPromptedRef.current = true;
            }
        });
    }, [
        deferredData?.attendance,
        currentUserId,
        onOpen,
        gameDeleted,
        hasPromptedRef,
    ]);
}
