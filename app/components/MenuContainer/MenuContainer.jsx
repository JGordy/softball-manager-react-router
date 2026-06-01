import { useState, useEffect } from "react";
import { ActionIcon, Menu, Text } from "@mantine/core";
import { IconDots } from "@tabler/icons-react";

import classes from "./MenuContainer.module.css";

/**
 * Generic MenuContainer
 * Props:
 * - sections: [{ label?: string, items: [{ key?, content, text?, leftSection?, onClick?, color?, disabled? }] }]
 * - menuProps: props forwarded to Mantine Menu
 * - target: optional custom Menu.Target children
 * - id: optional unique identifier to scope onboarding events
 */
export default function MenuContainer({
    sections = [],
    menuProps = {},
    target,
    id,
}) {
    const [opened, setOpened] = useState(false);

    useEffect(() => {
        if (!id) return;
        const handleToggle = (e) => {
            if (
                e.detail?.menuId === id &&
                typeof e.detail?.open === "boolean"
            ) {
                setOpened(e.detail.open);
            }
        };
        window.addEventListener("toggle-onboarding-menu", handleToggle);
        return () =>
            window.removeEventListener("toggle-onboarding-menu", handleToggle);
    }, [id]);

    const renderItem = (item, key) => {
        const { key: itemKey, content, text, ...rest } = item;
        return (
            <Menu.Item key={itemKey ?? key} {...rest}>
                {content ?? (text ? <Text>{text}</Text> : null)}
            </Menu.Item>
        );
    };

    return (
        <Menu
            shadow="md"
            radius="lg"
            withArrow
            offset={0}
            {...menuProps}
            opened={opened}
            onChange={setOpened}
        >
            <Menu.Target>
                {target ?? (
                    <ActionIcon
                        variant="light"
                        className={classes.actionIcon}
                        radius="xl"
                        size="lg"
                        aria-label="Toggle menu"
                        data-testid="menu-target-icon"
                    >
                        <IconDots />
                    </ActionIcon>
                )}
            </Menu.Target>

            <Menu.Dropdown
                p="md"
                className={id ? `tour-${id}-dropdown` : undefined}
            >
                {sections.map((section, sIdx) => {
                    const slug = section.label
                        ? section.label
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/(^-|-$)/g, "")
                        : null;
                    const sectionClassName = slug
                        ? id
                            ? `tour-${id}-section-${slug}`
                            : `tour-menu-section-${slug}`
                        : undefined;

                    return (
                        <div
                            key={section.label ?? sIdx}
                            className={sectionClassName}
                        >
                            {section.label && (
                                <Menu.Label>
                                    <Text size="sm">{section.label}</Text>
                                </Menu.Label>
                            )}

                            {Array.isArray(section.items) &&
                                section.items.map((item, iIdx) =>
                                    renderItem(item, `${sIdx}-${iIdx}`),
                                )}

                            {sIdx < sections.length - 1 && <Menu.Divider />}
                        </div>
                    );
                })}
            </Menu.Dropdown>
        </Menu>
    );
}
