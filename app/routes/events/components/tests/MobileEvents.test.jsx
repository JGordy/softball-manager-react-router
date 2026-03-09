import { useComputedColorScheme } from "@mantine/core";
import { render, screen, fireEvent } from "@/utils/test-utils";
import * as getGamesUtils from "@/utils/getGames";
import MobileEvents from "../MobileEvents";

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
        {games?.map((g) => (
            <div key={g.id}>{g.name}</div>
        ))}
    </div>
));

jest.mock("@/utils/getGames");

describe("MobileEvents Component", () => {
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

    it("renders with default 'upcoming' tab if future games exist", () => {
        getGamesUtils.default.mockReturnValue({
            futureGames: [{ id: "g1", name: "Game 1", teamId: "team1" }],
            pastGames: [],
        });

        render(<MobileEvents teams={mockTeams} />);
        expect(screen.getByText("Game 1")).toBeInTheDocument();
        expect(screen.getByText("Upcoming")).toBeInTheDocument();
    });

    it("renders with default 'past' tab if no future games", () => {
        getGamesUtils.default.mockReturnValue({
            futureGames: [],
            pastGames: [{ id: "g2", name: "Game 2", teamId: "team1" }],
        });

        render(<MobileEvents teams={mockTeams} />);
        expect(screen.getByText("Game 2")).toBeInTheDocument();
        expect(screen.getByText("Past")).toBeInTheDocument();
    });

    it("filters games when a team is selected", async () => {
        const games = [
            { id: "g1", name: "Game 1", teamId: "team1" },
            { id: "g2", name: "Game 2", teamId: "team2" },
        ];
        getGamesUtils.default.mockReturnValue({
            futureGames: games,
            pastGames: [],
        });

        render(<MobileEvents teams={mockTeams} />);

        fireEvent.click(screen.getByLabelText("Filter Games"));

        const teamOneOption = await screen.findByRole("radio", {
            name: "Team 1",
        });
        fireEvent.click(teamOneOption);

        expect(screen.getByText("Game 1")).toBeInTheDocument();
        expect(screen.queryByText("Game 2")).not.toBeInTheDocument();
    });
});
