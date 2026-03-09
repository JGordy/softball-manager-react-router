import { useState, useMemo } from "react";
import getGames from "@/utils/getGames";

export function useEventsData({ teams }) {
    const teamsData = useMemo(() => {
        return [...(teams?.managing || []), ...(teams?.playing || [])];
    }, [teams]);

    const [filterId, setFilterId] = useState("all");
    const [showFilters, setShowFilters] = useState(false);

    const { futureGames, pastGames } = useMemo(() => {
        return getGames({ teams: teamsData });
    }, [teamsData]);

    const handleFilterChange = (teamId) => {
        setFilterId(teamId);
        setShowFilters(false);
    };

    const toggleFilters = () => setShowFilters((prev) => !prev);
    const closeFilters = () => setShowFilters(false);

    const filteredFutureGames = useMemo(() => {
        if (filterId === "all") return futureGames;
        return futureGames?.filter((game) => game.teamId === filterId);
    }, [filterId, futureGames]);

    const filteredPastGames = useMemo(() => {
        if (filterId === "all") return pastGames;
        return pastGames?.filter((game) => game.teamId === filterId);
    }, [filterId, pastGames]);

    return {
        teamsData,
        filterId,
        showFilters,
        onFilterChange: handleFilterChange,
        onToggleFilters: toggleFilters,
        onCloseFilters: closeFilters,
        filteredFutureGames,
        filteredPastGames,
        hasFutureGames: futureGames?.length > 0,
    };
}
