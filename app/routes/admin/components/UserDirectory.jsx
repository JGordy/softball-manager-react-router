import { useState, useMemo } from "react";
import {
    Badge,
    Group,
    Paper,
    SegmentedControl,
    Text,
    Title,
} from "@mantine/core";
import { CollapsibleSection } from "./CollapsibleSection";
import { ItemCard } from "./ItemCard";

/**
 * Single, unified User Directory section with inline sort controls
 * (Recently Active, Newest Signups, Name A-Z).
 *
 * @param {{ recentUsers?: Array, activeUsers?: Array, users?: Array }} props
 * @returns {JSX.Element}
 */
export function UserDirectory({
    recentUsers = [],
    activeUsers = [],
    users = [],
}) {
    const [sortBy, setSortBy] = useState("active");

    // Merge provided lists into a deduplicated user array
    const rawUsers = useMemo(() => {
        if (users && users.length > 0) return users;
        const map = new Map();
        [...recentUsers, ...activeUsers].forEach((u) => {
            if (u && u.$id) map.set(u.$id, u);
        });
        return Array.from(map.values());
    }, [users, recentUsers, activeUsers]);

    const sortedUsers = useMemo(() => {
        const list = [...rawUsers];
        if (sortBy === "active") {
            return list.sort((a, b) => {
                const aTime = a.accessedAt
                    ? new Date(a.accessedAt).getTime()
                    : 0;
                const bTime = b.accessedAt
                    ? new Date(b.accessedAt).getTime()
                    : 0;
                return bTime - aTime;
            });
        }
        if (sortBy === "recent") {
            return list.sort((a, b) => {
                const aTime = a.registration
                    ? new Date(a.registration).getTime()
                    : 0;
                const bTime = b.registration
                    ? new Date(b.registration).getTime()
                    : 0;
                return bTime - aTime;
            });
        }
        if (sortBy === "name") {
            return list.sort((a, b) => {
                const aName = (a.name || a.email || "").toLowerCase();
                const bName = (b.name || b.email || "").toLowerCase();
                return aName.localeCompare(bName);
            });
        }
        return list;
    }, [rawUsers, sortBy]);

    return (
        <Paper
            id="user-directory-section"
            withBorder
            p="md"
            radius="md"
            mb="xl"
        >
            <Group
                justify="space-between"
                align="center"
                mb="md"
                wrap="wrap"
                gap="xs"
            >
                <Title order={3}>User Directory</Title>
                <SegmentedControl
                    color="lime"
                    size="xs"
                    radius="sm"
                    value={sortBy}
                    onChange={setSortBy}
                    data={[
                        { label: "Recently Active", value: "active" },
                        { label: "Newest Signups", value: "recent" },
                        { label: "Name (A–Z)", value: "name" },
                    ]}
                />
            </Group>

            <CollapsibleSection
                items={sortedUsers}
                initialLimit={5}
                renderItem={(u) => {
                    let rightSection = null;
                    if (sortBy === "active") {
                        const isRecentlyOnline =
                            u.accessedAt &&
                            new Date() - new Date(u.accessedAt) <
                                10 * 60 * 1000;
                        rightSection = (
                            <Badge
                                size="xs"
                                variant="light"
                                color={isRecentlyOnline ? "lime" : "gray"}
                            >
                                {u.accessedAt
                                    ? new Date(u.accessedAt).toLocaleString(
                                          [],
                                          {
                                              month: "numeric",
                                              day: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                          },
                                      )
                                    : "Never"}
                            </Badge>
                        );
                    } else if (sortBy === "recent") {
                        rightSection = (
                            <Text size="sm">
                                {u.registration
                                    ? new Date(
                                          u.registration,
                                      ).toLocaleDateString()
                                    : "Unknown"}
                            </Text>
                        );
                    } else {
                        rightSection = (
                            <Text size="xs" c="dimmed">
                                Joined{" "}
                                {u.registration
                                    ? new Date(
                                          u.registration,
                                      ).toLocaleDateString()
                                    : "—"}
                            </Text>
                        );
                    }

                    return (
                        <ItemCard
                            key={`user-${u.$id}`}
                            text={u.name || "Unknown"}
                            subText={u.email}
                            rightSection={rightSection}
                        />
                    );
                }}
            />
        </Paper>
    );
}
