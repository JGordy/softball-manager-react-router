import { Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
    IconBallBaseball,
    IconCalendar,
    IconEdit,
    IconMailFast,
    IconUserFilled,
    IconShieldLock,
    IconClipboardList,
} from "@tabler/icons-react";

import AddTeam from "@/forms/AddTeam";
import AddSingleGame from "@/forms/AddSingleGame";
import AddSeason from "@/forms/AddSeason";
import AddPlayer from "@/forms/AddPlayer";
import InvitePlayer from "@/forms/InvitePlayer";
import { useNavigate } from "react-router";

import useModal from "@/hooks/useModal";

import MenuContainer from "@/components/MenuContainer";
import ManageRolesDrawer from "./ManageRolesDrawer";

export default function TeamMenu({ userId, team, ownerView, players }) {
    const navigate = useNavigate();
    const { openModal } = useModal();
    const [rolesOpened, { open: openRoles, close: closeRoles }] =
        useDisclosure(false);

    const { $id: teamId, name: teamName, seasons, primaryColor } = team;

    const openEditTeamModal = () =>
        openModal({
            title: "Edit Team Details",
            children: (
                <AddTeam
                    action="edit-team"
                    actionRoute={`/team/${teamId}`}
                    userId={userId}
                    buttonColor={primaryColor}
                />
            ),
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

    const openInvitePlayerModal = () =>
        openModal({
            title: "Invite Player by Email",
            children: (
                <InvitePlayer
                    actionRoute={`/team/${teamId}`}
                    buttonColor={primaryColor}
                    teamId={teamId}
                    teamName={teamName}
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
            label: "Team Options",
            items: [
                {
                    key: "edit-team",
                    onClick: openEditTeamModal,
                    leftSection: <IconEdit size={18} />,
                    content: <Text>Edit Team Details</Text>,
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
            label: "Roster",
            items: [
                {
                    key: "ideal-lineup",
                    onClick: () => navigate(`/team/${teamId}/lineup`),
                    leftSection: <IconClipboardList size={18} />,
                    content: <Text>Set Lineups</Text>,
                },
                // {
                //     key: "add-player",
                //     onClick: openAddPlayerModal,
                //     leftSection: <IconUserFilled size={18} />,
                //     content: <Text>Add Player</Text>,
                // },
                {
                    key: "invite-player",
                    onClick: openInvitePlayerModal,
                    leftSection: <IconMailFast size={18} />,
                    content: <Text>Invite Player</Text>,
                },
            ],
        },
    ];

    if (ownerView) {
        sections.push({
            label: "Admin",
            items: [
                {
                    key: "manage-roles",
                    onClick: openRoles,
                    leftSection: <IconShieldLock size={18} />,
                    content: <Text>Manage Roles</Text>,
                },
            ],
        });
    }

    return (
        <>
            <MenuContainer sections={sections} />
            <ManageRolesDrawer
                opened={rolesOpened}
                onClose={closeRoles}
                players={players}
                teamId={teamId}
                userId={userId}
            />
        </>
    );
}
