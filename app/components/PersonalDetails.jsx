import { Group, List, Text, Title } from "@mantine/core";

import {
    IconFriends,
    IconHeadphonesFilled,
    IconMail,
    IconPhone,
} from "@tabler/icons-react";

import AddPlayer from "@/forms/AddPlayer";

import EditButton from "@/components/EditButton";

import useModal from "@/hooks/useModal";

const fields = {
    email: {
        icon: <IconMail size={20} />,
        label: "email",
        restricted: true,
    },
    phoneNumber: {
        icon: <IconPhone size={20} />,
        label: "phone number",
        restricted: true,
    },
    gender: {
        icon: <IconFriends size={20} />,
        label: "gender",
    },
    walkUpSong: {
        icon: <IconHeadphonesFilled size={20} />,
        label: "walk up song",
    },
};

export default function PersonalDetails({
    user,
    player,
    fieldsToDisplay,
    managerView,
    isCurrentUser,
}) {
    const { openModal } = useModal();

    const openPersonalDetailsModal = () =>
        openModal({
            title: "Update Personal Details",
            children: (
                <AddPlayer
                    action="edit-player"
                    actionRoute={`/user/${user?.$id}`}
                    confirmText="Update Details"
                    inputsToDisplay={["name", "gender", "song"]}
                    defaults={player}
                />
            ),
        });

    return (
        <>
            <Group justify="space-between" align="start" my="md">
                <List spacing="xs" size="sm" mt="8px" center>
                    {Object.entries({ ...fields, ...fieldsToDisplay }).map(
                        ([key, { icon, label, restricted }]) => {
                            const value = player[key];
                            if (restricted && !managerView) {
                                return null;
                            }
                            return (
                                <List.Item key={key} icon={icon}>
                                    <Text size="sm" c={!value ? "red" : ""}>
                                        {value || `${label} not listed*`}
                                    </Text>
                                </List.Item>
                            );
                        },
                    )}
                </List>
                {isCurrentUser && (
                    <EditButton setIsModalOpen={openPersonalDetailsModal} />
                )}
            </Group>
        </>
    );
}
