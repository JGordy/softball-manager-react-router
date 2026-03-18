import { Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useActionData } from "react-router";
import { useEffect } from "react";

import {
    IconBallBaseball,
    IconCalendar,
    IconEdit,
    IconRun,
    IconTrash,
} from "@tabler/icons-react";

import AddSingleGame from "@/forms/AddSingleGame";
import AddSeason from "@/forms/AddSeason";
import GenerateSeasonGames from "@/forms/GenerateSeasonGames";
import BulkDeleteGames from "@/forms/BulkDeleteGames";

import useModal from "@/hooks/useModal";

import MenuContainer from "@/components/MenuContainer";
import DrawerContainer from "@/components/DrawerContainer";

export default function SeasonMenu({ season }) {
    const { openModal } = useModal();
    const actionData = useActionData();

    const [
        deleteDrawerOpened,
        { open: openDeleteDrawer, close: closeDeleteDrawer },
    ] = useDisclosure(false);

    useEffect(() => {
        if (actionData?.success && actionData?.deleted) {
            closeDeleteDrawer();
        }
    }, [actionData, closeDeleteDrawer]);

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
                    teamId={teamId}
                    defaults={{
                        location: "",
                    }}
                    locationPlaceholder={season.location || ""}
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
                {
                    key: "add-practice",
                    onClick: () =>
                        openModal({
                            title: "Schedule Practice",
                            children: (
                                <AddSingleGame
                                    action="add-single-game"
                                    actionRoute={`/season/${seasonId}`}
                                    buttonColor={primaryColor}
                                    seasonId={seasonId}
                                    teamId={teamId}
                                    isPractice={true}
                                    confirmText="Schedule Practice"
                                    defaults={{
                                        location: "",
                                    }}
                                    locationPlaceholder={season.location || ""}
                                />
                            ),
                        }),
                    leftSection: <IconRun size={18} />,
                    content: <Text>Schedule Practice</Text>,
                },
                {
                    key: "delete-games",
                    onClick: openDeleteDrawer,
                    leftSection: (
                        <IconTrash
                            size={18}
                            color="var(--mantine-color-red-6)"
                        />
                    ),
                    content: <Text c="red">Delete Games</Text>,
                },
            ],
        },
    ];

    return (
        <>
            <MenuContainer sections={sections} />
            <DrawerContainer
                opened={deleteDrawerOpened}
                onClose={closeDeleteDrawer}
                title="Delete Games"
            >
                <BulkDeleteGames
                    action="delete-games"
                    actionRoute={`/season/${seasonId}`}
                    buttonColor="red"
                    season={season}
                    onCancel={closeDeleteDrawer}
                />
            </DrawerContainer>
        </>
    );
}
