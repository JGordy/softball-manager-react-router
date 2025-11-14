import { useEffect, useState } from "react";

import { useOutletContext } from "react-router";

import { ActionIcon, Alert, Group, Text } from "@mantine/core";

import { IconPencil, IconMail, IconPhone } from "@tabler/icons-react";

import useModal from "@/hooks/useModal";

import UpdateContactInfo from "@/forms/UpdateContactInfo";

// Format E.164 phone number for display
function formatPhoneNumber(phone) {
    if (!phone) return "No phone number provided";

    // Remove the + and any non-digits
    const cleaned = phone.replace(/\D/g, "");

    // Check if it's a US number (starts with 1 and has 11 digits)
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
        const areaCode = cleaned.slice(1, 4);
        const prefix = cleaned.slice(4, 7);
        const line = cleaned.slice(7, 11);
        return `(${areaCode}) ${prefix}-${line}`;
    }

    // For international numbers, just return with + and spaces
    return phone;
}

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
        <>
            {actionSuccess && (
                <Alert
                    mb="md"
                    variant="light"
                    color="green"
                    title="Success!"
                    radius="md"
                >
                    {actionSuccess}
                </Alert>
            )}

            {formError && (
                <Alert
                    mb="md"
                    variant="light"
                    color="red"
                    title="Invalid Form Submission"
                    radius="md"
                >
                    {formError}
                </Alert>
            )}

            <Text size="sm" mb="sm">
                Contact Details
            </Text>
            <Group justify="space-between">
                <div>
                    <Group align="center" mt="xs">
                        <IconMail />
                        <Text>{user.email || "No email provided"}</Text>
                    </Group>
                    <Group align="center" mt="xs">
                        <IconPhone />
                        <Text>{formatPhoneNumber(user.phone)}</Text>
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
        </>
    );
}
