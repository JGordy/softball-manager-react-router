import { useOutletContext } from "react-router";
import { getUserTeams } from "@/loaders/teams";
import { appwriteClientContext } from "@/contexts/router";

import MobileEvents from "./components/MobileEvents";
import DesktopEvents from "./components/DesktopEvents";

export async function loader({ context }) {
    const client = context.get(appwriteClientContext);
    const { managing, playing, userId } = await getUserTeams({ client });
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
