import { useComputedColorScheme } from "@mantine/core";
import { render, screen, fireEvent } from "@/utils/test-utils";
import * as getGamesUtils from "@/utils/getGames";
import DesktopEvents from "../DesktopEvents";

jest.mock("@mantine/core", () => {
    const actual = jest.requireActual("@mantine/core");
    return {
        ...actual,
        useComputedColorScheme: jest.fn(),
    };
});

jest.mock("@/components/UserHeader", () => ({ children, subText }) => (
    <div data-testid="user-header">
        <span>{subText}</span>
        {children}
    </div>
));

jest.mock("@/components/GamesList", () => ({ games }) => (
    <div data-testid="games-list">
        {games?.length > 0 ? (
            games.map((g) => <div key={g.id}>{g.name}</div>)
        ) : (
            <div data-testid="empty-list">No games</div>
        )}
    </div>
));

jest.mock("@/utils/getGames");

describe("DesktopEvents Component", () => {
    const mockTeams = {
        managing: [{ $id: "team1", name: "Team 1" }],
        playing: [{ $id: "team2", name: "Team 2" }],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useComputedColorScheme.mockReturnValue("light");
        getGamesUtils.default.mockReturnValue({
            futureGames: [],
            pastGames: [],
        });
    });

    it("renders both columns with headers", () => {
        render(<DesktopEvents teams={mockTeams} />);
        expect(screen.getByText("Upcoming Games")).toBeInTheDocument();
        expect(screen.getByText("Past Games")).toBeInTheDocument();
    });

    it("renders both upcoming and past games when present", () => {
        getGamesUtils.default.mockReturnValue({
            futureGames: [{ id: "g1", name: "Upcoming Game", teamId: "team1" }],
            pastGames: [{ id: "g2", name: "Past Game", teamId: "team1" }],
        });

        render(<DesktopEvents teams={mockTeams} />);

        expect(screen.getByText("Upcoming Game")).toBeInTheDocument();
        expect(screen.getByText("Past Game")).toBeInTheDocument();
    });

    it("renders correctly with empty game lists", () => {
        getGamesUtils.default.mockReturnValue({
            futureGames: [],
            pastGames: [],
        });

        render(<DesktopEvents teams={mockTeams} />);

        expect(screen.getAllByTestId("empty-list")).toHaveLength(2);
    });

    it("renders correctly when only future games are present", () => {
        getGamesUtils.default.mockReturnValue({
            futureGames: [{ id: "g1", name: "Upcoming Game", teamId: "team1" }],
            pastGames: [],
        });

        render(<DesktopEvents teams={mockTeams} />);

        expect(screen.getByText("Upcoming Game")).toBeInTheDocument();
        expect(screen.getByText("No games")).toBeInTheDocument();
    });

    it("renders correctly when only past games are present", () => {
        getGamesUtils.default.mockReturnValue({
            futureGames: [],
            pastGames: [{ id: "g2", name: "Past Game", teamId: "team1" }],
        });

        render(<DesktopEvents teams={mockTeams} />);

        expect(screen.getByText("Past Game")).toBeInTheDocument();
        expect(screen.getByText("No games")).toBeInTheDocument();
    });

    it("filters games in both columns when a team is selected", async () => {
        const futureGames = [
            { id: "g1", name: "Game 1 Future", teamId: "team1" },
            { id: "g2", name: "Game 2 Future", teamId: "team2" },
        ];
        const pastGames = [
            { id: "g3", name: "Game 1 Past", teamId: "team1" },
            { id: "g4", name: "Game 2 Past", teamId: "team2" },
        ];
        getGamesUtils.default.mockReturnValue({
            futureGames,
            pastGames,
        });

        render(<DesktopEvents teams={mockTeams} />);

        fireEvent.click(screen.getByLabelText("Filter Games"));

        const teamOneOption = await screen.findByRole("radio", {
            name: "Team 1",
        });
        fireEvent.click(teamOneOption);

        expect(screen.getByText("Game 1 Future")).toBeInTheDocument();
        expect(screen.queryByText("Game 2 Future")).not.toBeInTheDocument();
        expect(screen.getByText("Game 1 Past")).toBeInTheDocument();
        expect(screen.queryByText("Game 2 Past")).not.toBeInTheDocument();
    });
});
