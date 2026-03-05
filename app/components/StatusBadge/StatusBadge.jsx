import { Badge } from "@mantine/core";
import { IconBroadcast, IconBroadcastOff } from "@tabler/icons-react";

const StatusBadge = ({ status }) => {
    const statusProps = {
        connected: {
            color: "blue",
            leftSection: <IconBroadcast size={12} />,
            className: "live-pulse",
            style: { textTransform: "none" },
            children: "Live",
        },
        connecting: {
            color: "gray",
            children: "Syncing...",
        },
        syncing: {
            color: "blue",
            className: "live-pulse",
            children: "Updating...",
        },
        error: {
            color: "orange",
            leftSection: <IconBroadcastOff size={12} />,
            children: "Offline",
        },
        idle: {
            style: { display: "none" },
        },
    };

    const badgeProps = status
        ? statusProps[status] || {}
        : { style: { visibility: "hidden" } };

    const { style: statusStyle, ...restBadgeProps } = badgeProps;

    return (
        <Badge
            variant="light"
            size="sm"
            style={{ textTransform: "none", ...(statusStyle || {}) }}
            {...restBadgeProps}
        />
    );
};

export default StatusBadge;
