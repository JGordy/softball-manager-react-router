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
 */
export default function MenuContainer({
    sections = [],
    menuProps = {},
    target,
}) {
    const [opened, setOpened] = useState(false);

    useEffect(() => {
        const handleToggle = (e) => {
            if (typeof e.detail?.open === "boolean") {
                setOpened(e.detail.open);
            }
        };
        window.addEventListener("toggle-onboarding-menu", handleToggle);
        return () =>
            window.removeEventListener("toggle-onboarding-menu", handleToggle);
    }, []);

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
            opened={opened}
            onChange={setOpened}
            {...menuProps}
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

            <Menu.Dropdown p="md">
                {sections.map((section, sIdx) => (
                    <div
                        key={section.label ?? sIdx}
                        className={
                            section.label
                                ? `tour-menu-section-${section.label.toLowerCase().replace(/\s+/g, "-")}`
                                : undefined
                        }
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
                ))}
            </Menu.Dropdown>
        </Menu>
    );
}
