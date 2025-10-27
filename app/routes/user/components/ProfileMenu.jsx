import { Text } from "@mantine/core";

import { IconBallBaseball, IconUserSquareRounded } from "@tabler/icons-react";

import AddPlayer from "@/forms/AddPlayer";

import useModal from "@/hooks/useModal";

import MenuContainer from "@/components/MenuContainer";

export default function HomeMenu({ player }) {
    const { openModal } = useModal();

    const openPlayerDetailsModal = () =>
        openModal({
            title: "Update Player Details",
            children: (
                <AddPlayer
                    action="edit-player"
                    actionRoute={`/user/${player.userId}`}
                    confirmText="Update Details"
                    inputsToDisplay={["positions", "throws-bats"]}
                    defaults={player}
                />
            ),
        });

    const openPersonalDetailsModal = () =>
        openModal({
            title: "Update Personal Details",
            children: (
                <AddPlayer
                    action="edit-player"
                    actionRoute={`/user/${player?.userId}`}
                    confirmText="Update Details"
                    inputsToDisplay={["name", "gender", "song"]}
                    defaults={player}
                />
            ),
        });

    const sections = [
        {
            items: [
                {
                    key: "edit-personal",
                    onClick: openPersonalDetailsModal,
                    leftSection: <IconUserSquareRounded size={18} />,
                    content: <Text>Update Personal Details</Text>,
                },
                {
                    key: "edit-player",
                    onClick: openPlayerDetailsModal,
                    leftSection: <IconBallBaseball size={18} />,
                    content: <Text>Update Player Details</Text>,
                },
            ],
        },
    ];

    return <MenuContainer sections={sections} />;
}
