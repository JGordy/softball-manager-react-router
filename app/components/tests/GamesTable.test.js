import { screen, cleanup } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import GamesTable from "../GamesTable";

describe("GamesTable Component", () => {
    afterEach(() => {
        cleanup();
    });

    const mockGames = [
        {
            $id: "1",
            gameDate: "2023-10-01T10:00:00.000Z",
            timeZone: "UTC",
            opponent: "Team A",
            location: "Field 1",
            opponentScore: 5,
            yourScore: 7,
        },
        {
            $id: "2",
            gameDate: "2023-10-02T14:30:00.000Z",
            timeZone: "UTC",
            opponent: "Team B",
            location: "Field 2",
            opponentScore: 3,
            yourScore: 2,
        },
    ];

    it("renders table with correct headers", () => {
        render(
            <GamesTable
                games={mockGames}
                columns={["date", "time", "opponent", "location"]}
            />,
        );

        expect(screen.getByText("Date")).toBeInTheDocument();
        expect(screen.getByText("Time")).toBeInTheDocument();
        expect(screen.getByText("Opponent")).toBeInTheDocument();
        expect(screen.getByText("Location")).toBeInTheDocument();
    });

    it("renders rows with formatted content", () => {
        // Mock dateTime utils if strictly needed, but integration with formatters is fine for unit test
        render(
            <GamesTable
                games={mockGames}
                columns={["date", "time", "opponent"]}
            />,
        );

        expect(screen.getByText("Team A")).toBeInTheDocument();
        expect(screen.getByText("Team B")).toBeInTheDocument();

        // Check date formatting (assuming US locale default behavior works in test env)
        expect(screen.getByText(/Oct 1, 2023/)).toBeInTheDocument();
        expect(screen.getByText(/10:00 AM/)).toBeInTheDocument();
    });

    it("renders opponent score header correctly", () => {
        render(<GamesTable games={mockGames} columns={["opponentScore"]} />);
        expect(screen.getByText("Opponent Score")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
    });
});
