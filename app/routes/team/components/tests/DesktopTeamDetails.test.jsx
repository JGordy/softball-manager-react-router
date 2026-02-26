import { render, screen } from "@/utils/test-utils";
import DesktopTeamDetails from "../DesktopTeamDetails";
import getGames from "@/utils/getGames";

// Mock sub-components and utils
jest.mock("@/components/GameCalendarRow", () => () => (
    <div data-testid="game-calendar-row" />
));
jest.mock("@/components/GameCard", () => () => <div data-testid="game-card" />);
jest.mock("../DesktopRosterTable", () => () => (
    <div data-testid="desktop-roster-table" />
));
jest.mock("@/utils/getGames");

jest.mock("react-router", () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

describe("DesktopTeamDetails Component", () => {
    const mockTeam = {
        $id: "team1",
        seasons: [
            {
                $id: "season1",
                seasonName: "Test Season",
                startDate: "2026-01-01",
                endDate: "2026-12-31",
            },
        ],
    };

    const mockProps = {
        team: mockTeam,
        players: [],
        managerIds: ["user1"],
        managerView: true,
        user: { $id: "user1" },
        teamLogs: [],
    };

    beforeEach(() => {
        getGames.mockReturnValue({
            futureGames: [{ $id: "game1", gameDate: "2026-06-01" }],
            pastGames: [{ $id: "game2", gameDate: "2026-05-01" }],
        });
    });

    it("renders Roster Table", () => {
        render(<DesktopTeamDetails {...mockProps} />);
        expect(screen.getByText("Team Roster")).toBeInTheDocument();
        expect(screen.getByTestId("desktop-roster-table")).toBeInTheDocument();
    });

    it("renders Games Schedule section with GameCalendarRow", () => {
        render(<DesktopTeamDetails {...mockProps} />);
        expect(screen.getByText("Games Schedule")).toBeInTheDocument();
        expect(screen.getByTestId("game-calendar-row")).toBeInTheDocument();
    });

    it("renders Upcoming Games and Recent Results sections", () => {
        render(<DesktopTeamDetails {...mockProps} />);
        expect(screen.getByText("Upcoming Games")).toBeInTheDocument();
        expect(screen.getByText("Recent Results")).toBeInTheDocument();
    });

    it("renders Seasons Overview section", () => {
        render(<DesktopTeamDetails {...mockProps} />);
        expect(screen.getByText("Seasons Overview")).toBeInTheDocument();
        expect(screen.getByText("Test Season")).toBeInTheDocument();
    });
});
