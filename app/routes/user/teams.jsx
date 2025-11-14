import { useEffect } from "react";
import { useActionData } from "react-router";

import { Button, Container, Flex, Text, Title } from "@mantine/core";

import { IconPlus } from "@tabler/icons-react";

import branding from "@/constants/branding";

import LoaderDots from "@/components/LoaderDots";
import UserHeader from "@/components/UserHeader";

import AddTeam from "@/forms/AddTeam";
import { createTeam } from "@/actions/teams";

import sortTeams from "@/utils/sortTeamsBySeason";

import useModal from "@/hooks/useModal";

import { getUserTeams } from "@/loaders/teams";

import TeamCard from "./components/TeamCard";

export function meta() {
    return [
        { title: branding.name },
        { name: "description", content: branding.tagline },
    ];
}

export async function loader({ request }) {
    return getUserTeams({ request });
}

export function HydrateFallback() {
    return <LoaderDots message="Fetching your teams..." />;
}

export async function action({ request }) {
    const formData = await request.formData();
    const { _action, userId, ...values } = Object.fromEntries(formData);

    if (_action === "add-team") {
        return createTeam({ values, userId });
    }
}

const UserDashboard = ({ loaderData }) => {
    console.log("/teams ", { ...loaderData });
    const { managing, playing, userId } = loaderData;

    const actionData = useActionData();

    const { openModal, closeAllModals } = useModal();

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.status === 201) {
                    closeAllModals();
                } else if (actionData instanceof Error) {
                    console.error(
                        "An error occurred during team creation.",
                        actionData.message,
                    );
                }
            } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
            }
        };

        handleAfterSubmit();
    }, [actionData]);

    const openAddTeamModal = () =>
        openModal({
            title: "Add a New Team",
            children: <AddTeam actionRoute={"/teams"} userId={userId} />,
        });

    const renderTeamList = (teamList) => {
        // Create a shallow copy and sort it
        const sortedTeamList = [...teamList].sort(sortTeams);

        return (
            sortedTeamList.length > 0 && (
                <Flex
                    direction={{ base: "column", sm: "row" }}
                    justify={{ base: "center", sm: "start" }}
                    align={{ base: "stretch", sm: "center" }}
                    wrap="wrap"
                    gap={{ base: "sm", sm: "lg" }}
                    mih={50}
                >
                    {sortedTeamList.map((team) => (
                        <TeamCard key={team.$id} team={team} userId={userId} />
                    ))}
                </Flex>
            )
        );
    };

    return (
        <Container>
            <UserHeader subText="Here are all of your teams" />

            {managing.length > 0 && (
                <>
                    <Title order={4} my="sm" c="dimmed">
                        Teams I Manage
                    </Title>
                    {renderTeamList(managing)}
                </>
            )}

            {playing.length > 0 && (
                <>
                    <Title order={4} mb="sm" c="dimmed">
                        Teams I Play For
                    </Title>
                    {renderTeamList(playing)}
                </>
            )}

            {!managing.length && !playing.length && (
                <Text size="sm">
                    You don't have any teams. Create one below
                </Text>
            )}

            <Button
                component="div"
                variant="link"
                mt="md"
                onClick={openAddTeamModal}
                fullWidth
            >
                <IconPlus size={20} />
                Create New Team
            </Button>
        </Container>
    );
};

export default UserDashboard;
