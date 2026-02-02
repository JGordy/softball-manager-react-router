import { Text } from "@mantine/core";

import { IconPlus } from "@tabler/icons-react";

import AddTeam from "@/forms/AddTeam";

import useModal from "@/hooks/useModal";

import MenuContainer from "@/components/MenuContainer";

export default function DashboardMenu({ userId }) {
    const { openModal } = useModal();

    const openAddTeamModal = () =>
        openModal({
            title: "Add a New Team",
            children: <AddTeam actionRoute={"/dashboard"} userId={userId} />,
        });

    const sections = [
        {
            items: [
                {
                    key: "add-team",
                    onClick: openAddTeamModal,
                    leftSection: <IconPlus size={14} />,
                    content: <Text>Add New Team</Text>,
                },
            ],
        },
    ];

    return <MenuContainer sections={sections} />;
}
