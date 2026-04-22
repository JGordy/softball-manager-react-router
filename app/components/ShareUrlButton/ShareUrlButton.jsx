import { ActionIcon } from "@mantine/core";
import { IconShare } from "@tabler/icons-react";
import { showNotification } from "@/utils/showNotification";

import classes from "./ShareUrlButton.module.css";

export default function ShareUrlButton({ size = "lg", ...props }) {
    const handleShare = async () => {
        const url = window.location.href;
        const title = document.title;

        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    url,
                });
            } catch (error) {
                // Ignore AbortError which happens when user cancels the share sheet
                if (error.name !== "AbortError") {
                    console.error("Error sharing:", error);
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                showNotification({
                    message: "Link copied to clipboard",
                    variant: "success",
                });
            } catch (error) {
                console.error("Failed to copy URL:", error);
                showNotification({
                    message: "Failed to copy link",
                    variant: "error",
                });
            }
        }
    };

    return (
        <ActionIcon
            variant="light"
            size={size}
            radius="xl"
            onClick={handleShare}
            aria-label="Share page"
            className={classes.actionIcon}
            {...props}
        >
            <IconShare size={18} />
        </ActionIcon>
    );
}
