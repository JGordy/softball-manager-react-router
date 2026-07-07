import { useNavigate } from "react-router";

import { Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import {
    IconBallBaseball,
    IconCalendar,
    IconEdit,
    IconMailFast,
    IconShieldLock,
    IconClipboardList,
    IconSettings,
    IconShirtSport,
    IconUserMinus,
    IconTags,
    IconTrash,
} from "@tabler/icons-react";

import AddTeam from "@/forms/AddTeam";
import AddSingleGame from "@/forms/AddSingleGame";
import AddSeason from "@/forms/AddSeason";
import InvitePlayer from "@/forms/InvitePlayer";

import useModal from "@/hooks/useModal";

import MenuContainer from "@/components/MenuContainer";

import ManageRolesDrawer from "./ManageRolesDrawer";
import PlayerLabelsDrawer from "./PlayerLabelsDrawer";
import PreferencesDrawer from "./PreferencesDrawer";
import BulkJerseyNumberModal from "./BulkJerseyNumberModal";
import RemoveTeamDrawer from "./RemoveTeamDrawer";
import RemovePlayersDrawer from "./RemovePlayersDrawer";

export default function TeamMenu({ userId, team, ownerView, players }) {
    const navigate = useNavigate();
    const { openModal } = useModal();
    const [rolesOpened, { open: openRoles, close: closeRoles }] =
        useDisclosure(false);
    const [
        preferencesOpened,
        { open: openPreferences, close: closePreferences },
    ] = useDisclosure(false);
    const [removeOpened, { open: openRemove, close: closeRemove }] =
        useDisclosure(false);
    const [labelsOpened, { open: openLabels, close: closeLabels }] =
        useDisclosure(false);
    const [removeTeamOpened, { open: openRemoveTeam, close: closeRemoveTeam }] =
        useDisclosure(false);

    const { $id: teamId, name: teamName, seasons, primaryColor } = team;

    const openEditTeamModal = () =>
        openModal({
            title: "Edit Team Details",
            children: (
                <AddTeam
                    action="edit-team"
                    actionRoute={`/team/${teamId}`}
                    buttonColor={primaryColor}
                    initialValues={team}
                />
            ),
        });

    const openInvitePlayerModal = () =>
        openModal({
            title: "Invite Player by Email",
            children: (
                <InvitePlayer
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

    const openBulkJerseyModal = () =>
        openModal({
            title: "Assign Jersey Numbers",
            children: (
                <BulkJerseyNumberModal
                    players={players}
                    teamId={teamId}
                    primaryColor={primaryColor}
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
            label: "Lineup Options",
            items: [
                {
                    key: "ideal-lineup",
                    onClick: () => navigate(`/team/${teamId}/lineup`),
                    leftSection: <IconClipboardList size={18} />,
                    content: <Text>Set Lineups</Text>,
                },
                ...(ownerView
                    ? [
                          {
                              key: "manage-labels",
                              onClick: openLabels,
                              leftSection: <IconTags size={18} />,
                              content: <Text>Player Labels</Text>,
                          },
                          {
                              key: "preferences",
                              onClick: openPreferences,
                              leftSection: <IconSettings size={18} />,
                              content: <Text>Rules</Text>,
                          },
                      ]
                    : []),
            ],
        },
        {
            label: "Roster",
            items: [
                {
                    key: "invite-player",
                    onClick: openInvitePlayerModal,
                    leftSection: <IconMailFast size={18} />,
                    content: <Text>Invite Players</Text>,
                },
                {
                    key: "bulk-jersey-numbers",
                    onClick: openBulkJerseyModal,
                    leftSection: <IconShirtSport size={18} />,
                    content: <Text>Assign Numbers</Text>,
                },
                {
                    key: "remove-players",
                    onClick: openRemove,
                    leftSection: <IconUserMinus size={18} />,
                    content: <Text>Remove Players</Text>,
                },
                ...(ownerView
                    ? [
                          {
                              key: "manage-roles",
                              onClick: openRoles,
                              leftSection: <IconShieldLock size={18} />,
                              content: <Text>Manage Roles</Text>,
                          },
                      ]
                    : []),
            ],
        },
        ...(ownerView
            ? [
                  {
                      label: "Danger Zone",
                      items: [
                          {
                              key: "remove-team",
                              color: "red",
                              onClick: openRemoveTeam,
                              leftSection: <IconTrash size={18} />,
                              content: "Remove Team",
                          },
                      ],
                  },
              ]
            : []),
    ];

    return (
        <>
            <MenuContainer sections={sections} id="team-details-menu" />
            <ManageRolesDrawer
                opened={rolesOpened}
                onClose={closeRoles}
                players={players}
                teamId={teamId}
                userId={userId}
            />
            <PreferencesDrawer
                opened={preferencesOpened}
                onClose={closePreferences}
                team={team}
            />
            <RemovePlayersDrawer
                opened={removeOpened}
                onClose={closeRemove}
                players={players}
                teamId={teamId}
                userId={userId}
            />
            <PlayerLabelsDrawer
                opened={labelsOpened}
                onClose={closeLabels}
                team={team}
                players={players}
            />
            <RemoveTeamDrawer
                opened={removeTeamOpened}
                onClose={closeRemoveTeam}
                team={team}
                players={players}
            />
        </>
    );
}
