import { useState } from "react";
import { useOutletContext } from "react-router";
import { getUserTeams } from "@/loaders/teams";
import getGames from "@/utils/getGames";

import MobileEvents from "./components/MobileEvents";
import DesktopEvents from "./components/DesktopEvents";

export async function loader({ request }) {
    const { managing, playing, userId } = await getUserTeams({ request });
    return { userId, teams: { managing, playing } };
}

export default function EventsList({ loaderData }) {
    const { isDesktop } = useOutletContext();
    const teams = loaderData?.teams;
    const teamsData = [...(teams?.managing || []), ...(teams?.playing || [])];

    const [filterId, setFilterId] = useState("all");
    const [showFilters, setShowFilters] = useState(false);

    const { futureGames, pastGames } = getGames({ teams: teamsData });

    const handleFilterChange = (teamId) => {
        setFilterId(teamId);
        setShowFilters(false);
    };

    const toggleFilters = () => setShowFilters((prev) => !prev);
    const closeFilters = () => setShowFilters(false);

    const filterGames = (games) => {
        if (filterId === "all") return games;
        return games?.filter((game) => game.teamId === filterId);
    };

    const commonProps = {
        teamsData,
        filterId,
        onFilterChange: handleFilterChange,
        showFilters,
        onToggleFilters: toggleFilters,
        onCloseFilters: closeFilters,
        filteredFutureGames: filterGames(futureGames),
        filteredPastGames: filterGames(pastGames),
        hasFutureGames: futureGames?.length > 0,
    };

    if (isDesktop) {
        return <DesktopEvents {...commonProps} />;
    }

    return <MobileEvents {...commonProps} />;
}
