import { useEffect, useState } from "react";

import { Form, useOutletContext } from "react-router";

import { ActionIcon, Alert, Button, Divider, Group, Text } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import { IconLogout2, IconKey, IconRestore } from "@tabler/icons-react";

import useModal from "@/hooks/useModal";

import UpdatePassword from "@/forms/UpdatePassword";
import DrawerContainer from "@/components/DrawerContainer";

export default function AuthPanel({ actionData }) {
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

    const [formError, setFormError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(false);

    useEffect(() => {
        if (actionData?.success) {
            if (passwordResetOpened) {
                closeResetPassword();
            }
            closeAllModals();
            setFormError(null);
            setActionSuccess(actionData.message);
        }

        if (actionData?.status === 500) {
            setTimeout(() => {
                setFormError(actionData.message);
                setActionSuccess(null);
                closeAllModals();
            }, 300);
        }
    }, [actionData, closeAllModals]);

    const openUpdatePasswordModal = () =>
        openModal({
            title: "Update Your Password",
            children: <UpdatePassword actionRoute="/settings" />,
        });

    return (
        <>
            {actionSuccess && (
                <Alert mb="md" variant="light" color="green" title="Success!">
                    {actionSuccess}
                </Alert>
            )}

            {formError && (
                <Alert
                    mb="md"
                    variant="light"
                    color="red"
                    title="Invalid Form Submission"
                >
                    {formError}
                </Alert>
            )}

            <Group justify="space-between" mb="sm">
                <Text>Change Password</Text>
                <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label="Update Password"
                    style={{ cursor: "pointer" }}
                    onClick={openUpdatePasswordModal}
                    size="lg"
                >
                    <IconKey size={20} />
                </ActionIcon>
            </Group>

            <Group justify="space-between">
                <Text>Reset Password</Text>
                <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label="Reset Password"
                    style={{ cursor: "pointer" }}
                    onClick={openResetPassword}
                    size="lg"
                >
                    <IconRestore size={20} />
                </ActionIcon>
            </Group>

            <Divider my="sm" />

            <Button
                color="red"
                onClick={openLogoutDrawer}
                variant="subtle"
                px="0px"
                size="md"
            >
                <Group gap="xs">
                    <IconLogout2 size={16} mr="xs" />
                    Log out
                </Group>
            </Button>

            <DrawerContainer
                opened={passwordResetOpened}
                onClose={closeResetPassword}
                title="Reset Password"
            >
                <UpdatePassword
                    action="password-reset"
                    actionRoute="/settings"
                    confirmText="Yes, Reset my Password"
                    user={user}
                />
            </DrawerContainer>

            <DrawerContainer
                opened={logoutDrawerOpened}
                onClose={closeLogoutDrawer}
                title="Confirm Log Out"
            >
                <Text size="md" mb="xl">
                    Are you sure you want to log out? You will need to log in
                    again to access your content.
                </Text>
                <Form method="post">
                    <input type="hidden" name="_action" value="logout" />
                    <Button
                        type="submit"
                        color="red"
                        variant="filled"
                        size="md"
                        fullWidth
                    >
                        <Group gap="xs">
                            <IconLogout2 size={16} mr="xs" />
                            Yes, Log out
                        </Group>
                    </Button>
                </Form>
            </DrawerContainer>
        </>
    );
}
