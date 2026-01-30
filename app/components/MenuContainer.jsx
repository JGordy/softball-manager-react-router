import React from "react";
import { ActionIcon, Menu, Text } from "@mantine/core";
import { IconDots } from "@tabler/icons-react";

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
    const renderItem = (item, key) => (
        <Menu.Item
            key={item.key ?? key}
            onClick={item.onClick}
            leftSection={item.leftSection}
            color={item.color}
            disabled={item.disabled}
            style={item.style}
        >
            {item.content ?? (item.text ? <Text>{item.text}</Text> : null)}
        </Menu.Item>
    );

    return (
        <Menu shadow="md" radius="lg" withArrow offset={0} {...menuProps}>
            <Menu.Target>
                {target ?? (
                    <ActionIcon variant="light" radius="xl" size="lg">
                        <IconDots />
                    </ActionIcon>
                )}
            </Menu.Target>

            <Menu.Dropdown p="md">
                {sections.map((section, sIdx) => (
                    <div key={section.label ?? sIdx}>
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
