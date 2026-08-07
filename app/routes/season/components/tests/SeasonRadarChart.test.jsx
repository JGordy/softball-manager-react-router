import { render, screen, fireEvent } from "@/utils/test-utils";
import SeasonRadarChart from "../SeasonRadarChart";

// Mock @mantine/charts
jest.mock("@mantine/charts", () => ({
    RadarChart: ({ data, series }) => (
        <div data-testid="mantine-radar-chart">
            <span data-testid="series-count">{series.length}</span>
            <span data-testid="data-count">{data.length}</span>
        </div>
    ),
}));

// Mock Tabler icons
jest.mock("@tabler/icons-react", () => ({
    IconArrowUpRight: () => <div data-testid="icon-up" />,
    IconArrowDownRight: () => <div data-testid="icon-down" />,
    IconMinus: () => <div data-testid="icon-minus" />,
}));

describe("SeasonRadarChart Component", () => {
    const mockGames = [
        { score: 12, opponentScore: 8, result: "W" },
        { score: 14, opponentScore: 4, result: "W" },
    ];
    const mockLogs = [
        { playerId: "p1", eventType: "single", rbi: 2 },
        { playerId: "p1", eventType: "double", rbi: 1 },
    ];
    const mockPlayers = [{ $id: "p1", firstName: "John", lastName: "Doe" }];

    const mockPrevSeasonData = {
        season: { $id: "prev-s1", seasonName: "Spring 2025" },
        games: [{ score: 10, opponentScore: 10, result: "T" }],
        logs: [{ playerId: "p1", eventType: "single", rbi: 1 }],
    };

    it("renders radar chart and default platform average view when no prev season exists", () => {
        render(
            <SeasonRadarChart
                games={mockGames}
                logs={mockLogs}
                players={mockPlayers}
            />,
        );

        expect(screen.getByTestId("mantine-radar-chart")).toBeInTheDocument();
        expect(screen.getByText("vs. Avg Team")).toBeInTheDocument();
        expect(screen.getByText("Average Team")).toBeInTheDocument();
        expect(screen.getAllByText("Runs / Gm").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Hits / Gm").length).toBeGreaterThan(0);
    });

    it("renders previous season toggle option when previousSeasonData is provided", () => {
        render(
            <SeasonRadarChart
                games={mockGames}
                logs={mockLogs}
                players={mockPlayers}
                previousSeasonData={mockPrevSeasonData}
            />,
        );

        expect(screen.getByText("vs. Prev Season")).toBeInTheDocument();
        expect(screen.getByText("Spring 2025")).toBeInTheDocument();
    });

    it("allows toggling between platform average and previous season", () => {
        render(
            <SeasonRadarChart
                games={mockGames}
                logs={mockLogs}
                players={mockPlayers}
                previousSeasonData={mockPrevSeasonData}
            />,
        );

        const platformBtn = screen.getByText("vs. Avg Team");
        fireEvent.click(platformBtn);

        expect(screen.getByText("Average Team")).toBeInTheDocument();
    });
});
