import { Box } from "@mantine/core";

import useModal from "@/hooks/useModal";
import { useResponseNotification } from "@/utils/showNotification";
import { useOutletContext } from "react-router";

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

    useResponseNotification(actionData);

    const openAddTeamModal = () =>
        openModal({
            title: "Add a New Team",
            children: <AddTeam actionRoute={"/dashboard"} userId={userId} />,
        });

    return (
        <Box px="md" py="md">
            <UserHeader subText="Team and events summary" stats={stats}>
                {!isDesktop && <DashboardMenu userId={userId} />}
            </UserHeader>

            {isDesktop ? (
                <DesktopDashboard
                    teamList={teamList}
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
