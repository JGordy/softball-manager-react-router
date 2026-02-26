import { useState, useEffect } from "react";
import { Box, Button, Group } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

import useModal from "@/hooks/useModal";
import { useResponseNotification } from "@/utils/showNotification";
import { useOutletContext, Link } from "react-router";

import branding from "@/constants/branding";
import UserHeader from "@/components/UserHeader";
import AddTeam from "@/forms/AddTeam";
import { createTeam } from "@/actions/teams";
import { getUserTeams } from "@/loaders/teams";

import DashboardMenu from "./components/DashboardMenu";
import MobileDashboard from "./components/MobileDashboard";
import DesktopDashboard from "./components/DesktopDashboard";

export function meta() {
    return [
        { title: branding.name },
        { name: "description", content: branding.tagline },
    ];
}

export async function loader({ request }) {
    const { managing, playing, userId, stats } = await getUserTeams({
        request,
        isDashboard: true,
    });
    return {
        teams: { managing, playing },
        userId,
        stats,
    };
}

export async function action({ request }) {
    const formData = await request.formData();
    const { _action, userId, ...values } = Object.fromEntries(formData);

    if (_action === "add-team") {
        return createTeam({ values, userId });
    }
}

export default function Dashboard({ loaderData, actionData }) {
    const { openModal } = useModal();
    const { user, isDesktop } = useOutletContext();
    const userId = user?.$id;

    const teams = loaderData?.teams;
    const stats = loaderData?.stats;
    const teamList = [...(teams?.managing || []), ...(teams?.playing || [])];

    const initialTeamId = teamList?.length > 0 ? teamList[0].$id : null;
    const [activeTeamId, setActiveTeamId] = useState(initialTeamId);

    // If teamList changes and the activeTeamId is no longer in the list, reset it
    useEffect(() => {
        if (!teamList || teamList.length === 0) {
            setActiveTeamId(null);
        } else if (!teamList.find((t) => t.$id === activeTeamId)) {
            setActiveTeamId(teamList[0]?.$id || null);
        }
    }, [teamList, activeTeamId]);

    useResponseNotification(actionData);

    const openAddTeamModal = () =>
        openModal({
            title: "Add a New Team",
            children: <AddTeam actionRoute={"/dashboard"} userId={userId} />,
        });

    return (
        <Box px="md" py="md">
            <UserHeader subText="Team and events summary" stats={stats}>
                {!isDesktop ? (
                    <DashboardMenu userId={userId} />
                ) : (
                    <Group>
                        <Button
                            variant="light"
                            color="gray"
                            size="sm"
                            onClick={openAddTeamModal}
                            leftSection={<IconPlus size={16} />}
                        >
                            Add Team
                        </Button>
                        {activeTeamId && (
                            <Button
                                component={Link}
                                to={`/team/${activeTeamId}`}
                                variant="light"
                                size="sm"
                            >
                                View Full Team Details
                            </Button>
                        )}
                    </Group>
                )}
            </UserHeader>

            {isDesktop ? (
                <DesktopDashboard
                    teamList={teamList}
                    activeTeamId={activeTeamId}
                    setActiveTeamId={setActiveTeamId}
                    openAddTeamModal={openAddTeamModal}
                />
            ) : (
                <MobileDashboard
                    teamList={teamList}
                    openAddTeamModal={openAddTeamModal}
                />
            )}
        </Box>
    );
}
