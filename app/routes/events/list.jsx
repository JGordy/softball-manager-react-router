import { useOutletContext } from "react-router";
import { getUserTeams } from "@/loaders/teams";

import MobileEvents from "./components/MobileEvents";
import DesktopEvents from "./components/DesktopEvents";

export async function loader({ request }) {
    const { managing, playing, userId } = await getUserTeams({ request });
    return { userId, teams: { managing, playing } };
}

export default function EventsList({ loaderData }) {
    const { isDesktop } = useOutletContext();
    const teams = loaderData?.teams;

    if (isDesktop) {
        return <DesktopEvents teams={teams} />;
    }

    return <MobileEvents teams={teams} />;
}
