import { useEffect } from "react";
import { useOutletContext } from "react-router";

import {
    SimpleGrid,
    Card,
    Text,
    Title,
    Group,
    Avatar,
    Stack,
    Button,
    Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import {
    IconUser,
    IconLock,
    IconBell,
    IconHelp,
    IconPencil,
    IconLogout2,
    IconKey,
    IconRestore,
} from "@tabler/icons-react";

import useModal from "@/hooks/useModal";
import UpdateContactInfo from "@/forms/UpdateContactInfo";
import UpdatePassword from "@/forms/UpdatePassword";

import NotificationsPanel from "./NotificationsPanel";
import PoliciesPanel from "./PoliciesPanel";
import LogoutDrawer from "./LogoutDrawer";
import ResetPasswordDrawer from "./ResetPasswordDrawer";

function formatPhoneNumber(phone) {
    if (!phone) return "No phone number provided";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
        const areaCode = cleaned.slice(1, 4);
        const prefix = cleaned.slice(4, 7);
        const line = cleaned.slice(7, 11);
        return `(${areaCode}) ${prefix}-${line}`;
    }
    return phone;
}

function DashboardCard({
    icon: Icon,
    iconColor,
    title,
    description,
    children,
}) {
    return (
        <Card withBorder radius="lg" p="xl" shadow="sm">
            <Group mb="md">
                <Icon size={24} color={`var(--mantine-color-${iconColor}-5)`} />
                <Title order={3}>{title}</Title>
            </Group>
            <Divider mb="md" />
            {description && (
                <Text size="sm" c="dimmed" mb="lg">
                    {description}
                </Text>
            )}
            {children}
        </Card>
    );
}

export default function DesktopSettingsDashboard({ actionData, teams }) {
    const { user } = useOutletContext();
    const { openModal, closeAllModals } = useModal();

    const [
        passwordResetOpened,
        { open: openResetPassword, close: closeResetPassword },
    ] = useDisclosure();
    const [
        logoutDrawerOpened,
        { open: openLogoutDrawer, close: closeLogoutDrawer },
    ] = useDisclosure();

    useEffect(() => {
        if (actionData?.success) {
            if (passwordResetOpened) {
                closeResetPassword();
            }
            closeAllModals();
        }
    }, [actionData, closeAllModals, passwordResetOpened, closeResetPassword]);

    const initials = `${user?.name?.[0] ?? ""}`.toUpperCase();

    const openUpdateContactInfoModal = () =>
        openModal({
            title: "Update Contact Information",
            children: (
                <UpdateContactInfo
                    actionRoute="/settings"
                    user={user}
                    defaults={{
                        email: user?.email || "",
                        phoneNumber: formatPhoneNumber(user?.phone),
                    }}
                />
            ),
        });

    const openUpdatePasswordModal = () =>
        openModal({
            title: "Update Your Password",
            children: <UpdatePassword actionRoute="/settings" />,
        });

    return (
        <SimpleGrid
            cols={2}
            spacing="lg"
            mt="xl"
            data-testid="desktop-settings-dashboard"
        >
            {/* Account Card */}
            <DashboardCard
                icon={IconUser}
                iconColor="lime"
                title="Account Profile"
                description="View and update your contact information. This is how teammates and managers can reach you."
            >
                <Group
                    wrap="nowrap"
                    align="flex-start"
                    justify="space-between"
                    gap="lg"
                >
                    <Group wrap="nowrap" align="flex-start" gap="lg">
                        <Avatar size="xl" radius="md" color="lime">
                            {initials || "U"}
                        </Avatar>
                        <Stack gap="xs">
                            <Text fw={600} size="lg">
                                {user?.name || "Test User"}
                            </Text>
                            <Text c="dimmed" size="sm">
                                {user?.email || "No email"}
                            </Text>
                            <Text c="dimmed" size="sm">
                                {formatPhoneNumber(user?.phone)}
                            </Text>
                        </Stack>
                    </Group>
                    <Button
                        variant="light"
                        color="lime"
                        onClick={openUpdateContactInfoModal}
                        rightSection={<IconPencil size={16} />}
                    >
                        Edit Profile
                    </Button>
                </Group>
            </DashboardCard>

            {/* Login Options Card */}
            <DashboardCard
                icon={IconLock}
                iconColor="blue"
                title="Login Options"
                description="Manage your login credentials. Keep your account secure by using a strong, unique password."
            >
                <Stack gap="sm">
                    <Button
                        variant="light"
                        color="blue"
                        onClick={openUpdatePasswordModal}
                        fullWidth
                        justify="space-between"
                        rightSection={<IconKey size={16} />}
                    >
                        Change Password
                    </Button>
                    <Button
                        variant="light"
                        color="gray"
                        onClick={openResetPassword}
                        fullWidth
                        justify="space-between"
                        rightSection={<IconRestore size={16} />}
                    >
                        Reset Password
                    </Button>
                    <Button
                        color="red"
                        onClick={openLogoutDrawer}
                        variant="light"
                        radius="md"
                        justify="flex-start"
                    >
                        <Group gap="xs">
                            <IconLogout2 size={16} mr="xs" />
                            Log out
                        </Group>
                    </Button>
                </Stack>
            </DashboardCard>

            {/* Notifications Card */}
            <DashboardCard
                icon={IconBell}
                iconColor="orange"
                title="Notifications"
            >
                <NotificationsPanel teams={teams} isDesktop={true} />
            </DashboardCard>

            {/* Resources Card */}
            <DashboardCard
                icon={IconHelp}
                iconColor="grape"
                title="Resources & Support"
                description="Need help or want to review our policies?"
            >
                <Stack gap="md">
                    <Button
                        component="a"
                        href="mailto:support@rostrhq.app"
                        variant="light"
                        color="grape"
                        fullWidth
                    >
                        Contact Support
                    </Button>
                    <PoliciesPanel isDesktop={true} />
                </Stack>
            </DashboardCard>

            <ResetPasswordDrawer
                opened={passwordResetOpened}
                onClose={closeResetPassword}
                user={user}
            />

            <LogoutDrawer
                opened={logoutDrawerOpened}
                onClose={closeLogoutDrawer}
            />
        </SimpleGrid>
    );
}
