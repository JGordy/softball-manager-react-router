import { ActionIcon, Menu } from "@mantine/core";
import {
    IconExternalLink,
    IconChartBar,
    IconDatabase,
    IconServer,
    IconBug,
} from "@tabler/icons-react";

const EXTERNAL_TOOLS = [
    {
        label: "Umami Analytics",
        href: "https://cloud.umami.is/analytics/us/websites/1e945f69-4632-4c87-a229-42769d855efa",
        icon: IconChartBar,
    },
    {
        label: "Appwrite Console",
        href: "https://cloud.appwrite.io/console/project-fra-679b95f10030c4821c90/overview/platforms",
        icon: IconDatabase,
    },
    {
        label: "Render Server",
        href: "https://dashboard.render.com/web/srv-cv69doan91rc73bdbrkg",
        icon: IconServer,
    },
    {
        label: "Sentry Issues",
        href: "https://joseph-gordy.sentry.io/issues/?project=4510845363814400",
        icon: IconBug,
    },
];

export function ExternalToolsMenu() {
    return (
        <Menu withinPortal position="bottom-end" shadow="sm">
            <Menu.Target>
                <ActionIcon
                    radius="md"
                    variant="light"
                    color="lime"
                    size="lg"
                    aria-label="External Tools"
                >
                    <IconExternalLink size={20} />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label>External Tools</Menu.Label>
                {EXTERNAL_TOOLS.map(({ label, href, icon: Icon }) => (
                    <Menu.Item
                        key={label}
                        component="a"
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        leftSection={<Icon size={18} />}
                        fz="md"
                    >
                        {label}
                    </Menu.Item>
                ))}
            </Menu.Dropdown>
        </Menu>
    );
}
