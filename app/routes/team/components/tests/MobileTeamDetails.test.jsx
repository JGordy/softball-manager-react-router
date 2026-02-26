import { render, screen } from "@/utils/test-utils";
import MobileTeamDetails from "../MobileTeamDetails";

// Mock sub-components
jest.mock("../PlayerList", () => () => <div data-testid="player-list" />);
jest.mock("../SeasonList", () => () => <div data-testid="season-list" />);
jest.mock("../GamesList", () => () => <div data-testid="games-list" />);

describe("MobileTeamDetails Component", () => {
    const mockTeam = {
        $id: "team1",
        primaryColor: "blue",
        seasons: [{ $id: "season1", games: [{ $id: "game1" }] }],
    };

    const mockProps = {
        team: mockTeam,
        players: [],
        managerIds: ["user1"],
        managerView: true,
        user: { $id: "user1" },
        teamLogs: [],
    };

    it("renders Roster, Seasons, and Games tabs", () => {
        render(<MobileTeamDetails {...mockProps} />);

        expect(screen.getByText("Roster")).toBeInTheDocument();
        expect(screen.getByText("Seasons")).toBeInTheDocument();
        expect(screen.getByText("Games")).toBeInTheDocument();
    });

    it("renders sub-components correctly", () => {
        render(<MobileTeamDetails {...mockProps} />);

        // Since TabsWrapper defaults to seasons, check if season list is present
        expect(screen.getByTestId("season-list")).toBeInTheDocument();
    });
});
