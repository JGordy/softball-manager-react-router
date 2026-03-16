import { ActionIcon, Menu } from "@mantine/core";
import {
    IconExternalLink,
    IconChartBar,
    IconDatabase,
    IconServer,
    IconBug,
} from "@tabler/icons-react";

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
                <Menu.Item
                    component="a"
                    href="https://cloud.umami.is/analytics/us/websites/1e945f69-4632-4c87-a229-42769d855efa"
                    target="_blank"
                    leftSection={<IconChartBar size={18} />}
                    fz="md"
                >
                    Umami Analytics
                </Menu.Item>
                <Menu.Item
                    component="a"
                    href="https://cloud.appwrite.io/console/project-fra-679b95f10030c4821c90/overview/platforms"
                    target="_blank"
                    leftSection={<IconDatabase size={18} />}
                    fz="md"
                >
                    Appwrite Console
                </Menu.Item>
                <Menu.Item
                    component="a"
                    href="https://dashboard.render.com/web/srv-cv69doan91rc73bdbrkg"
                    target="_blank"
                    leftSection={<IconServer size={18} />}
                    fz="md"
                >
                    Render Server
                </Menu.Item>
                <Menu.Item
                    component="a"
                    href="https://joseph-gordy.sentry.io/issues/?project=4510845363814400"
                    target="_blank"
                    leftSection={<IconBug size={18} />}
                    fz="md"
                >
                    Sentry Issues
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}
