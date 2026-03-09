import { useEffect, useState } from "react";

import { useOutletContext } from "react-router";

import { ActionIcon, Alert, Divider, Group, Stack, Text } from "@mantine/core";

import { IconPencil, IconMail, IconPhone } from "@tabler/icons-react";

import useModal from "@/hooks/useModal";

import UpdateContactInfo from "@/forms/UpdateContactInfo";

import { formatPhoneNumber } from "@/utils/phone";

export default function AccountPanel({ actionData }) {
    const { user } = useOutletContext();

    const { openModal, closeAllModals } = useModal();

    const [formError, setFormError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(false);

    useEffect(() => {
        if (actionData?.success) {
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

    const openUpdateContactInfoModal = () =>
        openModal({
            title: "Update Contact Information",
            children: (
                <UpdateContactInfo
                    actionRoute="/settings"
                    user={user}
                    defaults={{
                        email: user.email || "",
                        phoneNumber: formatPhoneNumber(user.phone),
                    }}
                />
            ),
        });

    return (
        <Stack gap="md">
            <Text size="sm" c="dimmed">
                View and update your contact information. This is how teammates
                and managers can reach you.
            </Text>

            <Divider />

            {actionSuccess && (
                <Alert
                    variant="light"
                    color="lime"
                    title="Success!"
                    radius="md"
                >
                    {actionSuccess}
                </Alert>
            )}

            {formError && (
                <Alert
                    variant="light"
                    color="red"
                    title="Invalid Form Submission"
                    radius="md"
                >
                    {formError}
                </Alert>
            )}

            <Text size="sm" fw={500}>
                Contact Details
            </Text>
            <Group justify="space-between">
                <div>
                    <Group align="center" gap="xs">
                        <IconMail size={18} />
                        <Text size="sm">
                            {user.email || "No email provided"}
                        </Text>
                    </Group>
                    <Group align="center" gap="xs" mt="xs">
                        <IconPhone size={18} />
                        <Text size="sm">{formatPhoneNumber(user.phone)}</Text>
                    </Group>
                </div>

                <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label="Update Contact Information"
                    style={{ cursor: "pointer" }}
                    onClick={openUpdateContactInfoModal}
                    size="lg"
                >
                    <IconPencil />
                </ActionIcon>
            </Group>
        </Stack>
    );
}
