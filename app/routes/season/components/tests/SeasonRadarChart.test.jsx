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

    it("correctly calculates hitting metrics and deltas for previous season from logs", () => {
        render(
            <SeasonRadarChart
                games={mockGames}
                logs={mockLogs}
                players={mockPlayers}
                previousSeasonData={mockPrevSeasonData}
            />,
        );

        // Previous season has 1 hit / 1 at-bat (SLG 1.000) vs current season (SLG 1.500)
        // Diff should be +0.5, NOT +1.5 (which would indicate prev season SLG was 0)
        expect(screen.getByText("SLG: +0.5")).toBeInTheDocument();
        // AVG: current 1.000 vs prev 1.000 -> diff 0
        expect(screen.getByText("AVG: 0")).toBeInTheDocument();
        // RPG: current 13 vs prev 10 -> diff +3
        expect(screen.getByText("RPG: +3")).toBeInTheDocument();
    });

    it("displays 'No Data' for hitting delta badges when previous season has no logs (legacy unlogged games)", () => {
        const unloggedPrevSeasonData = {
            season: { $id: "prev-s2", seasonName: "Spring 2024" },
            games: [{ score: 8, opponentScore: 5, result: "W" }],
            logs: [],
        };

        render(
            <SeasonRadarChart
                games={mockGames}
                logs={mockLogs}
                players={mockPlayers}
                previousSeasonData={unloggedPrevSeasonData}
            />,
        );

        // Hitting metrics should display 'No Data' rather than skewed comparisons against 0
        expect(screen.getByText("AVG: No Data")).toBeInTheDocument();
        expect(screen.getByText("SLG: No Data")).toBeInTheDocument();
        // Non-hitting metrics (RPG) are still computed from game scores: current 13 vs prev 8 -> +5
        expect(screen.getByText("RPG: +5")).toBeInTheDocument();
    });

    it("includes uncharted/substitute player logs in current season metrics without dropping them", () => {
        const logsWithUnchartedPlayer = [
            ...mockLogs,
            { playerId: "uncharted-player-99", eventType: "single", rbi: 1 },
        ];

        render(
            <SeasonRadarChart
                games={mockGames}
                logs={logsWithUnchartedPlayer}
                players={mockPlayers} // uncharted-player-99 is not in mockPlayers
            />,
        );

        // 3 hits across 2 games = 1.5 Hits / Gm (rounded to 1.5 in card)
        expect(screen.getByText("1.5")).toBeInTheDocument();
    });
});
