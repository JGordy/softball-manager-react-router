import { Text } from "@mantine/core";

import {
    IconBallBaseball,
    IconCalendar,
    IconEdit,
    IconMailFast,
    IconUserFilled,
} from "@tabler/icons-react";

import AddTeam from "@/forms/AddTeam";
import AddSingleGame from "@/forms/AddSingleGame";
import AddSeason from "@/forms/AddSeason";
import AddPlayer from "@/forms/AddPlayer";

import useModal from "@/hooks/useModal";

import MenuContainer from "@/components/MenuContainer";

export default function TeamMenu({ userId, team }) {
    const { openModal } = useModal();

    const { $id: teamId, seasons, primaryColor } = team;

    const openAddTeamModal = () =>
        openModal({
            title: "Edit Team Details",
            children: <AddTeam actionRoute={"/"} userId={userId} />,
        });

    const openAddPlayerModal = () =>
        openModal({
            title: "Add a New Player",
            children: (
                <AddPlayer
                    actionRoute={`/team/${teamId}`}
                    buttonColor={primaryColor}
                    inputsToDisplay={["name", "gender", "contact", "positions"]}
                />
            ),
        });

    const openAddSeasonModal = () =>
        openModal({
            title: "Add a New Season",
            children: (
                <AddSeason
                    actionRoute={`/team/${teamId}`}
                    buttonColor={primaryColor}
                    teamId={teamId}
                />
            ),
        });

    const openAddGameModal = () =>
        openModal({
            title: "Add a New Game",
            children: (
                <AddSingleGame
                    action="add-single-game"
                    actionRoute={`/team/${teamId}`}
                    buttonColor={primaryColor}
                    teamId={teamId}
                    seasons={seasons}
                    confirmText="Create Game"
                />
            ),
        });

    const sections = [
        {
            label: "Team Details",
            items: [
                {
                    key: "add-team",
                    onClick: openAddTeamModal,
                    leftSection: <IconEdit size={18} />,
                    content: <Text>Edit Team</Text>,
                },
                {
                    key: "add-season",
                    onClick: openAddSeasonModal,
                    leftSection: <IconCalendar size={18} />,
                    content: <Text>Add Season</Text>,
                },
                {
                    key: "add-game",
                    onClick: openAddGameModal,
                    leftSection: <IconBallBaseball size={18} />,
                    content: <Text>Add Game</Text>,
                },
            ],
        },
        {
            label: "Players",
            items: [
                {
                    key: "add-player",
                    onClick: openAddPlayerModal,
                    leftSection: <IconUserFilled size={18} />,
                    content: <Text>Add Player with Details</Text>,
                },
                {
                    key: "invite-player",
                    disabled: true,
                    // onClick: openAddPlayerModal,
                    leftSection: <IconMailFast size={18} />,
                    content: <Text>Invite Player (Coming Soon!)</Text>,
                },
            ],
        },
    ];

    return <MenuContainer sections={sections} />;
}
