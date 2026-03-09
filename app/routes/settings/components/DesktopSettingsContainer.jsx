import { Tabs, Paper, Title, Box } from "@mantine/core";
import {
    IconUser,
    IconLock,
    IconBell,
    IconHelp,
    IconFileText,
} from "@tabler/icons-react";

import AccountPanel from "./AccountPanel";
import AuthPanel from "./AuthPanel";
import NotificationsPanel from "./NotificationsPanel";
import SupportPanel from "./SupportPanel";
import PoliciesPanel from "./PoliciesPanel";

export default function DesktopSettingsContainer({ actionData, teams }) {
    return (
        <Tabs
            defaultValue="account"
            orientation="vertical"
            placement="left"
            variant="pills"
            radius="md"
            mt="xl"
            data-testid="desktop-settings-container"
            styles={{
                root: {
                    alignItems: "flex-start",
                },
                panel: {
                    paddingLeft: "2rem",
                    width: "100%",
                },
                tab: {
                    padding: "1rem",
                    marginBottom: "0.5rem",
                    fontSize: "1rem",
                },
            }}
        >
            <Tabs.List style={{ minWidth: 250 }}>
                <Tabs.Tab value="account" leftSection={<IconUser size={18} />}>
                    Account
                </Tabs.Tab>
                <Tabs.Tab
                    value="authentication"
                    leftSection={<IconLock size={18} />}
                >
                    Login Options
                </Tabs.Tab>
                <Tabs.Tab
                    value="notifications"
                    leftSection={<IconBell size={18} />}
                >
                    Notifications
                </Tabs.Tab>
                <Tabs.Tab value="support" leftSection={<IconHelp size={18} />}>
                    Support
                </Tabs.Tab>
                <Tabs.Tab
                    value="policies"
                    leftSection={<IconFileText size={18} />}
                >
                    Policies & Agreements
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="account">
                <Paper p="xl" radius="md" bg="transparent">
                    <Title order={3} mb="lg">
                        Account Settings
                    </Title>
                    <Box maw={600}>
                        <AccountPanel actionData={actionData} />
                    </Box>
                </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="authentication">
                <Paper p="xl" radius="md" bg="transparent">
                    <Title order={3} mb="lg">
                        Login Options
                    </Title>
                    <Box maw={600}>
                        <AuthPanel actionData={actionData} />
                    </Box>
                </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="notifications">
                <Paper p="xl" radius="md" bg="transparent">
                    <Title order={3} mb="lg">
                        Notifications
                    </Title>
                    <Box maw={800}>
                        <NotificationsPanel teams={teams} />
                    </Box>
                </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="support">
                <Paper p="xl" radius="md" bg="transparent">
                    <Title order={3} mb="lg">
                        Support
                    </Title>
                    <Box maw={800}>
                        <SupportPanel />
                    </Box>
                </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="policies">
                <Paper p="xl" radius="md" bg="transparent">
                    <Title order={3} mb="lg">
                        Policies & Agreements
                    </Title>
                    <Box maw={800}>
                        <PoliciesPanel />
                    </Box>
                </Paper>
            </Tabs.Panel>
        </Tabs>
    );
}
