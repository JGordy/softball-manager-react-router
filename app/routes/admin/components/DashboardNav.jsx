import { useState, useEffect } from "react";
import { Button, Group, ScrollArea, Box } from "@mantine/core";
import {
    IconActivity,
    IconChartBar,
    // IconHistory,
    // IconMapPin,
    IconTimeline,
    IconUsers,
} from "@tabler/icons-react";

export function MobileDashboardNav() {
    const [activeSection, setActiveSection] = useState("analytics-summary");

    const items = [
        {
            label: "Stats",
            icon: <IconTimeline size={16} />,
            target: "analytics-summary",
        },
        {
            label: "Health",
            icon: <IconActivity size={16} />,
            target: "insights",
        },
        {
            label: "Teams",
            icon: <IconChartBar size={16} />,
            target: "team-sections",
        },
        {
            label: "Users",
            icon: <IconUsers size={16} />,
            target: "user-sections",
        },
    ];

    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: "-10% 0px -80% 0px", // Trigger when section is near the top
            threshold: 0,
        };

        const observerCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(
            observerCallback,
            observerOptions,
        );

        items.forEach((item) => {
            const el = document.getElementById(item.target);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <Box
            hiddenFrom="sm"
            style={{
                position: "sticky",
                top: 0,
                zIndex: 100,
                backgroundColor: "var(--mantine-color-body)",
                borderBottom: "1px solid var(--mantine-color-default-border)",
            }}
            mb="md"
        >
            <ScrollArea h={54} w="100%" scrollbars="x" type="never">
                <Group
                    wrap="nowrap"
                    px="md"
                    h="100%"
                    gap="xs"
                    justify="center"
                    mt="sm"
                >
                    <DashboardNavContent
                        activeSection={activeSection}
                        items={items}
                    />
                </Group>
            </ScrollArea>
        </Box>
    );
}

function DashboardNavContent({ activeSection, items }) {
    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) {
            const offset = 60; // Approximate height of the sticky nav
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition =
                elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth",
            });
        }
    };

    return items.map((item) => (
        <Button
            key={item.target}
            variant={activeSection === item.target ? "light" : "subtle"}
            size="xs"
            leftSection={item.icon}
            onClick={() => scrollTo(item.target)}
            px="xs"
            color={activeSection === item.target ? "green" : "gray"}
            styles={{
                root: {
                    height: 32,
                    borderRadius: 100,
                    fontWeight: 500,
                    transition: "all 200ms ease",
                },
                section: {
                    marginRight: 4,
                },
            }}
        >
            {item.label}
        </Button>
    ));
}
