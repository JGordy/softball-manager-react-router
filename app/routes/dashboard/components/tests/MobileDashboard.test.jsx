import { MemoryRouter } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import MobileDashboard from "../MobileDashboard";
import * as getGamesUtils from "@/utils/getGames";
import * as dateTimeUtils from "@/utils/dateTime";

jest.mock("@/utils/getGames");
jest.mock("@/utils/dateTime");

describe("MobileDashboard Component", () => {
    const mockTeamList = [
        {
            $id: "team-1",
            name: "Team One",
            isManager: true,
            games: [],
        },
        {
            $id: "team-non-manager",
            name: "Non-Manager Team",
            isManager: false,
            games: [],
        },
    ];

    const mockOpenAddTeamModal = jest.fn();

    const renderDashboard = (teamList = mockTeamList) => {
        return render(
            <MemoryRouter>
                <MobileDashboard
                    teamList={teamList}
                    openAddTeamModal={mockOpenAddTeamModal}
                />
            </MemoryRouter>,
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementation
        getGamesUtils.default.mockImplementation(({ teams, teamId }) => ({
            futureGames: [],
            pastGames: [],
        }));
        dateTimeUtils.getGameDayStatus.mockReturnValue("future");
    });

    it("renders team cards in a carousel", () => {
        renderDashboard();
        expect(screen.getAllByText("Team One").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Non-Manager Team").length).toBeGreaterThan(0);
    });

    it("displays content and appropriate manager actions for an upcoming game", () => {
        getGamesUtils.default.mockReturnValue({
            futureGames: [{ $id: "game-1", opponent: "Upcoming Opponent", gameDate: "2025-01-01", playerChart: null }],
            pastGames: [],
        });
        
        renderDashboard();
        expect(screen.getByText(/Upcoming Opponent/i)).toBeInTheDocument();
        expect(screen.getByText("Create Lineup")).toBeInTheDocument();
    });

    it("displays 'Edit Lineup' when a playerChart exists", () => {
        getGamesUtils.default.mockReturnValue({
            futureGames: [{ $id: "game-1", opponent: "Upcoming Opponent", gameDate: "2025-01-01", playerChart: { lineups: [] } }],
            pastGames: [],
        });

        renderDashboard();
        expect(screen.getByText("Edit Lineup")).toBeInTheDocument();
    });

    it("displays 'Go Live' button for in-progress games", () => {
        getGamesUtils.default.mockReturnValue({
            futureGames: [{ $id: "game-1", opponent: "Live Opponent", gameDate: "2025-01-01" }],
            pastGames: [],
        });
        dateTimeUtils.getGameDayStatus.mockReturnValue("in progress");

        renderDashboard();
        expect(screen.getByText("Go Live")).toBeInTheDocument();
    });

    it("displays 'See Awards' and 'Recap' for past games", () => {
        getGamesUtils.default.mockReturnValue({
            futureGames: [],
            pastGames: [{ $id: "game-past", opponent: "Past Opponent", gameDate: "2023-01-01" }],
        });

        renderDashboard();
        expect(screen.getByText(/Past Opponent/i)).toBeInTheDocument();
        expect(screen.getByText("See Awards")).toBeInTheDocument();
        expect(screen.getByText("Recap")).toBeInTheDocument();
    });

    it("hides manager-only actions for non-managers", () => {
        getGamesUtils.default.mockReturnValue({
            futureGames: [{ $id: "game-1", opponent: "Hidden Opponent", gameDate: "2025-01-01" }],
            pastGames: [],
        });

        renderDashboard([mockTeamList[1]]); // Non-Manager Team
        expect(screen.getByText(/Hidden Opponent/i)).toBeInTheDocument();
        expect(screen.queryByText("Create Lineup")).not.toBeInTheDocument();
    });

    it("displays empty state when there are no teams", () => {
        renderDashboard([]);
        expect(screen.getByText("Create your first team")).toBeInTheDocument();
    });
});
