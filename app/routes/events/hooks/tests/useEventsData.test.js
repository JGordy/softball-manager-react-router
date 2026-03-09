import { renderHook, act } from "@testing-library/react";
import { useEventsData } from "../useEventsData";
import * as getGamesUtils from "@/utils/getGames";

jest.mock("@/utils/getGames");

describe("useEventsData Hook", () => {
    const mockTeams = {
        managing: [{ $id: "team1", name: "Team 1" }],
        playing: [{ $id: "team2", name: "Team 2" }],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        getGamesUtils.default.mockReturnValue({
            futureGames: [
                { id: "g1", name: "Future 1", teamId: "team1" },
                { id: "g2", name: "Future 2", teamId: "team2" },
            ],
            pastGames: [{ id: "g3", name: "Past 1", teamId: "team1" }],
        });
    });

    it("initializes with default values and computed games", () => {
        const { result } = renderHook(() =>
            useEventsData({ teams: mockTeams }),
        );

        expect(result.current.filterId).toBe("all");
        expect(result.current.showFilters).toBe(false);
        expect(result.current.filteredFutureGames).toHaveLength(2);
        expect(result.current.filteredPastGames).toHaveLength(1);
        expect(result.current.hasFutureGames).toBe(true);
        expect(result.current.teamsData).toHaveLength(2);
    });

    it("filters games when filterId changes", () => {
        const { result } = renderHook(() =>
            useEventsData({ teams: mockTeams }),
        );

        act(() => {
            result.current.onFilterChange("team1");
        });

        expect(result.current.filterId).toBe("team1");
        expect(result.current.filteredFutureGames).toHaveLength(1);
        expect(result.current.filteredFutureGames[0].id).toBe("g1");
        expect(result.current.filteredPastGames).toHaveLength(1);
        expect(result.current.showFilters).toBe(false); // Should close after change
    });

    it("toggles showFilters state", () => {
        const { result } = renderHook(() =>
            useEventsData({ teams: mockTeams }),
        );

        act(() => {
            result.current.onToggleFilters();
        });
        expect(result.current.showFilters).toBe(true);

        act(() => {
            result.current.onCloseFilters();
        });
        expect(result.current.showFilters).toBe(false);
    });

    it("updates hasFutureGames correctly", () => {
        getGamesUtils.default.mockReturnValue({
            futureGames: [],
            pastGames: [],
        });

        const { result } = renderHook(() =>
            useEventsData({ teams: mockTeams }),
        );
        expect(result.current.hasFutureGames).toBe(false);
    });
});
