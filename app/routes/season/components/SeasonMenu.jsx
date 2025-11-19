import { Text } from "@mantine/core";

import { IconBallBaseball, IconCalendar, IconEdit } from "@tabler/icons-react";

import AddSingleGame from "@/forms/AddSingleGame";
import AddSeason from "@/forms/AddSeason";
import GenerateSeasonGames from "@/forms/GenerateSeasonGames";

import useModal from "@/hooks/useModal";

import MenuContainer from "@/components/MenuContainer";

export default function SeasonMenu({ season }) {
    const { openModal } = useModal();

    const { $id: seasonId, teams, teamId } = season;
    const [team] = teams;
    const { primaryColor } = team;

    const openGenerateGamesModal = () =>
        openModal({
            title: "Generate Game Placeholders",
            children: (
                <GenerateSeasonGames
                    actionRoute={`/season/${seasonId}`}
                    buttonColor={primaryColor}
                    season={season}
                />
            ),
        });

    const openAddGameModal = () =>
        openModal({
            title: "Add a Single Game",
            children: (
                <AddSingleGame
                    action="add-single-game"
                    actionRoute={`/season/${seasonId}`}
                    buttonColor={primaryColor}
                    seasonId={seasonId}
                />
            ),
        });

    const openEditSeasonModal = () =>
        openModal({
            title: "Update Season Details",
            children: (
                <AddSeason
                    action="edit-season"
                    actionRoute={`/season/${seasonId}`}
                    buttonColor={primaryColor}
                    confirmText="Update Season"
                    teamId={teamId}
                />
            ),
        });

    const sections = [
        {
            label: "Season Details",
            items: [
                {
                    key: "edit-season",
                    onClick: openEditSeasonModal,
                    leftSection: <IconEdit size={18} />,
                    content: <Text>Edit Season</Text>,
                },
            ],
        },
        {
            label: "Schedule",
            items: [
                {
                    key: "generate-games",
                    onClick: openGenerateGamesModal,
                    leftSection: <IconCalendar size={18} />,
                    content: <Text>Generate Games</Text>,
                },
                {
                    key: "add-game",
                    onClick: openAddGameModal,
                    leftSection: <IconBallBaseball size={18} />,
                    content: <Text>Add Single Game</Text>,
                },
            ],
        },
    ];

    return <MenuContainer sections={sections} />;
}
