import { notifications } from "@mantine/notifications";

import classes from "@/styles/notifications.module.css";

/**
 * Show a notification with consistent styling
 * @param {Object} options - Notification options
 * @param {string} options.message - The notification message (required)
 * @param {string} [options.title] - The notification title
 * @param {'info'|'success'|'warning'|'error'} [options.variant='info'] - Notification type
 * @param {number} [options.autoClose=5000] - Auto close delay in ms (false to disable)
 * @param {string} [options.position='top-center'] - Notification position
 * @param {boolean} [options.withCloseButton=true] - Show close button
 */
export function showNotification({
    message,
    title,
    variant = "info",
    autoClose = 5000,
    position = "top-center",
    withCloseButton = true,
    ...rest
}) {
    // Map variant to color
    const variantColors = {
        info: "blue",
        success: "green",
        warning: "orange",
        error: "red.9",
    };

    // Map variant to default title if not provided
    const variantTitles = {
        info: "Info",
        success: "Success",
        warning: "Warning",
        error: "Error",
    };

    const color = variantColors[variant] || variantColors.info;
    const defaultTitle = title || variantTitles[variant];

    return notifications.show({
        message,
        title: defaultTitle,
        color,
        autoClose,
        position,
        withCloseButton,
        classNames: classes,
        ...rest,
    });
}
