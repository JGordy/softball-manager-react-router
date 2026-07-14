import { render, screen } from "@/utils/test-utils";
import MobileTeamDetails from "../MobileTeamDetails";

// Mock sub-components
jest.mock("../PlayerList", () => () => <div data-testid="player-list" />);
jest.mock("../SeasonList", () => () => <div data-testid="season-list" />);
jest.mock("../GamesList", () => ({ primaryColor }) => (
    <div data-testid="games-list" data-primarycolor={primaryColor} />
));

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
        const { container } = render(<MobileTeamDetails {...mockProps} />);

        expect(screen.getByText("Roster")).toBeInTheDocument();
        expect(screen.getByText("Seasons")).toBeInTheDocument();
        expect(screen.getByText("Games")).toBeInTheDocument();

        // Verify onboarding class wrapper is present
        const tabsBox = container.querySelector(".tour-mobile-tabs");
        expect(tabsBox).toBeInTheDocument();
    });

    it("renders sub-components correctly", () => {
        render(<MobileTeamDetails {...mockProps} />);
        expect(screen.getByTestId("games-list")).toHaveAttribute(
            "data-primarycolor",
            "blue",
        );
        // Since TabsWrapper defaults to seasons, check if season list is present
        expect(screen.getByTestId("season-list")).toBeInTheDocument();
    });

    it("renders the active tab panel based on tab prop", () => {
        const onTabChange = jest.fn();
        render(
            <MobileTeamDetails
                {...mockProps}
                tab="games"
                onTabChange={onTabChange}
            />,
        );
        expect(screen.getByTestId("games-list")).toBeVisible();
        expect(screen.getByTestId("season-list")).not.toBeVisible();
    });
});
