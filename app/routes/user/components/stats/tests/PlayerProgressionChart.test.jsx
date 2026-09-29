import { render, screen, fireEvent } from "@/utils/test-utils";
import PlayerProgressionChart from "../PlayerProgressionChart";
import { trackEvent } from "@/utils/analytics";

jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

// Mock @mantine/charts AreaChart and LineChart
jest.mock("@mantine/charts", () => ({
    AreaChart: ({ data, series, withYAxis, tooltipProps }) => (
        <div data-testid="mantine-area-chart">
            <span data-testid="series-count">{series.length}</span>
            <span data-testid="data-count">{data.length}</span>
            <span data-testid="with-y-axis">{String(withYAxis)}</span>
            {tooltipProps?.content && data.length > 0 && (
                <div data-testid="tooltip-preview">
                    {tooltipProps.content({
                        payload: [{ payload: data[0] }],
                    })}
                </div>
            )}
        </div>
    ),
    LineChart: ({ data, series, withYAxis, tooltipProps }) => (
        <div data-testid="mantine-line-chart">
            <span data-testid="series-count">{series.length}</span>
            <span data-testid="data-count">{data.length}</span>
            <span data-testid="with-y-axis">{String(withYAxis)}</span>
        </div>
    ),
}));

describe("PlayerProgressionChart Component", () => {
    const mockGames = [
        {
            $id: "g1",
            gameDate: "2026-09-13T14:00:00Z",
            opponent: "Thunder",
            teamId: "t1",
        },
        {
            $id: "g2",
            gameDate: "2026-09-20T14:00:00Z",
            opponent: "Decatur Raiders",
            teamId: "t1",
        },
    ];

    const mockTeams = [{ $id: "t1", name: "O.P. Sliders" }];

    const mockLogs = [
        { gameId: "g1", playerId: "u1", eventType: "single" },
        { gameId: "g1", playerId: "u1", eventType: "out" },
        { gameId: "g2", playerId: "u1", eventType: "double", rbi: 1 },
        { gameId: "g2", playerId: "u1", eventType: "single" },
    ];

    it("renders empty state placeholder when fewer than 2 games exist", () => {
        render(
            <PlayerProgressionChart
                logs={[{ gameId: "g1", playerId: "u1", eventType: "single" }]}
                games={[mockGames[0]]}
                teams={mockTeams}
                userId="u1"
            />,
        );

        expect(screen.getByText("Not Enough Game Data")).toBeInTheDocument();
        expect(
            screen.getByText(/at least 2 logged games with hitting stats/i),
        ).toBeInTheDocument();
        expect(
            screen.queryByTestId("mantine-area-chart"),
        ).not.toBeInTheDocument();
    });

    it("renders progression chart and summary metrics in 'All' mode by default", () => {
        render(
            <PlayerProgressionChart
                logs={mockLogs}
                games={mockGames}
                teams={mockTeams}
                userId="u1"
            />,
        );

        expect(screen.getByTestId("mantine-area-chart")).toBeInTheDocument();
        expect(screen.getByTestId("data-count")).toHaveTextContent("2");
        expect(screen.getByTestId("series-count")).toHaveTextContent("5");
        // In All mode, Y-axis is scale-free (withYAxis={false})
        expect(screen.getByTestId("with-y-axis")).toHaveTextContent("false");

        // KPI cards for All mode
        expect(screen.getByText("Current AVG")).toBeInTheDocument();
        expect(screen.getByText("Current OBP")).toBeInTheDocument();
        expect(screen.getByText("Current SLG")).toBeInTheDocument();
        expect(screen.getByText("Current OPS")).toBeInTheDocument();

        // Custom balanced legend items
        expect(screen.getAllByText("SLG").length).toBeGreaterThan(0);
        expect(screen.getAllByText("OBP").length).toBeGreaterThan(0);

        // Metric Glossary
        expect(screen.getByText("Metric Glossary")).toBeInTheDocument();

        // Tooltip rendered preview
        expect(screen.getByText("vs Thunder")).toBeInTheDocument();
        expect(screen.getByText(/Game: 1\/2/i)).toBeInTheDocument();
    });

    it("switches to single metric view (e.g. AVG), enables Y-axis, and shows explainer", () => {
        render(
            <PlayerProgressionChart
                logs={mockLogs}
                games={mockGames}
                teams={mockTeams}
                userId="u1"
            />,
        );

        const avgTab = screen.getByRole("radio", { name: "AVG" });
        fireEvent.click(avgTab);

        // When single metric is selected, series count is 1 and withYAxis is true
        expect(screen.getByTestId("series-count")).toHaveTextContent("1");
        expect(screen.getByTestId("with-y-axis")).toHaveTextContent("true");

        // Single metric KPI titles
        expect(screen.getByText("High")).toBeInTheDocument();
        expect(screen.getByText("Low")).toBeInTheDocument();
        expect(screen.getByText("Net Trend")).toBeInTheDocument();

        // Metric Explainer card
        expect(screen.getByText("Hits / At-Bats")).toBeInTheDocument();
        expect(
            screen.getByText(/Measures hitting frequency/i),
        ).toBeInTheDocument();
    });

    it("switches to ISO metric and shows ISO formula and explanation", () => {
        render(
            <PlayerProgressionChart
                logs={mockLogs}
                games={mockGames}
                teams={mockTeams}
                userId="u1"
            />,
        );

        const isoTab = screen.getByRole("radio", { name: "ISO" });
        fireEvent.click(isoTab);

        expect(screen.getByTestId("series-count")).toHaveTextContent("1");
        expect(screen.getByTestId("with-y-axis")).toHaveTextContent("true");
        expect(screen.getByText("Slugging - Batting Avg")).toBeInTheDocument();
        expect(
            screen.getByText(/Isolated Power measures pure extra-base thump/i),
        ).toBeInTheDocument();
    });

    it("switches across other metrics (OBP, SLG, OPS) and displays their respective formulas", () => {
        render(
            <PlayerProgressionChart
                logs={mockLogs}
                games={mockGames}
                teams={mockTeams}
                userId="u1"
            />,
        );

        // OBP
        fireEvent.click(screen.getByRole("radio", { name: "OBP" }));
        expect(
            screen.getByText("(Hits + BB) / (AB + BB + SF)"),
        ).toBeInTheDocument();

        // SLG
        fireEvent.click(screen.getByRole("radio", { name: "SLG" }));
        expect(screen.getByText("Total Bases / At-Bats")).toBeInTheDocument();

        // OPS
        fireEvent.click(screen.getByRole("radio", { name: "OPS" }));
        expect(screen.getByText("On-Base + Slugging")).toBeInTheDocument();
    });

    it("renders negative net trend with negative sign when average drops", () => {
        // Game 1: 3/3 (1.000), Game 2: 0/3 (.500) -> Net trend: -0.500
        const droppingLogs = [
            { gameId: "g1", playerId: "u1", eventType: "single" },
            { gameId: "g1", playerId: "u1", eventType: "single" },
            { gameId: "g1", playerId: "u1", eventType: "single" },
            { gameId: "g2", playerId: "u1", eventType: "out" },
            { gameId: "g2", playerId: "u1", eventType: "out" },
            { gameId: "g2", playerId: "u1", eventType: "out" },
        ];

        render(
            <PlayerProgressionChart
                logs={droppingLogs}
                games={mockGames}
                teams={mockTeams}
                userId="u1"
            />,
        );

        fireEvent.click(screen.getByRole("radio", { name: "AVG" }));
        expect(screen.getByText("-0.500")).toBeInTheDocument();
    });

    it("renders custom tooltip in single-metric mode with cumulative rate and delta", () => {
        render(
            <PlayerProgressionChart
                logs={mockLogs}
                games={mockGames}
                teams={mockTeams}
                userId="u1"
            />,
        );

        fireEvent.click(screen.getByRole("radio", { name: "AVG" }));

        // The tooltip preview is rendered by the AreaChart mock
        expect(screen.getByTestId("tooltip-preview")).toBeInTheDocument();
        expect(screen.getByText("vs Thunder")).toBeInTheDocument();
        expect(screen.getByText("Cumulative")).toBeInTheDocument();
        expect(screen.getByText("0.000")).toBeInTheDocument(); // First game delta is 0
    });

    it("tracks player-trends-metric-changed Umami event when selecting different metrics", () => {
        jest.clearAllMocks();
        render(
            <PlayerProgressionChart
                logs={mockLogs}
                games={mockGames}
                teams={mockTeams}
                userId="u1"
            />,
        );

        fireEvent.click(screen.getByRole("radio", { name: "AVG" }));
        expect(trackEvent).toHaveBeenCalledWith(
            "player-trends-metric-changed",
            {
                userId: "u1",
                metric: "AVG",
            },
        );

        fireEvent.click(screen.getByRole("radio", { name: "OPS" }));
        expect(trackEvent).toHaveBeenCalledWith(
            "player-trends-metric-changed",
            {
                userId: "u1",
                metric: "OPS",
            },
        );
    });
});
