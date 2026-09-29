import { render, screen, fireEvent } from "@/utils/test-utils";
import SeasonProgressionChart from "../SeasonProgressionChart";
import { trackEvent } from "@/utils/analytics";

jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

// Mock @mantine/charts CompositeChart
jest.mock("@mantine/charts", () => ({
    CompositeChart: ({
        data,
        series,
        withYAxis,
        tooltipProps,
        referenceLines,
        lineProps,
        yAxisProps,
    }) => (
        <div data-testid="mantine-composite-chart">
            <span data-testid="series-count">{series.length}</span>
            <span data-testid="data-count">{data.length}</span>
            <span data-testid="with-y-axis">{String(withYAxis)}</span>
            <span data-testid="y-axis-domain-max">
                {yAxisProps?.domain ? yAxisProps.domain[1] : ""}
            </span>
            <span data-testid="reference-lines-count">
                {referenceLines ? referenceLines.length : 0}
            </span>
            <span data-testid="first-series-name">{series[0]?.name || ""}</span>
            {lineProps?.dot && data.length > 0 && (
                <svg data-testid="custom-dots-svg">
                    {data.map((item, index) => (
                        <g
                            key={item.gameId || index}
                            data-testid={`dot-${item.outcome}`}
                        >
                            {lineProps.dot({
                                cx: 10 + index * 20,
                                cy: 50,
                                payload: item,
                            })}
                        </g>
                    ))}
                </svg>
            )}
            {tooltipProps?.content && data.length > 0 && (
                <div data-testid="tooltip-preview">
                    {tooltipProps.content({
                        payload: [{ payload: data[0] }],
                    })}
                </div>
            )}
        </div>
    ),
}));

describe("SeasonProgressionChart Component", () => {
    const mockGames = [
        {
            $id: "g1",
            gameDate: "2026-09-13T14:00:00Z",
            opponent: "Thunder",
            home: true,
            score: 10,
            opponentScore: 5,
        },
        {
            $id: "g2",
            gameDate: "2026-09-20T14:00:00Z",
            opponent: "Decatur Raiders",
            home: true,
            score: 4,
            opponentScore: 8,
        },
    ];

    const mockPlayers = [
        { $id: "p1", name: "Player One" },
        { $id: "p2", name: "Player Two" },
    ];

    const mockLogs = [
        // Game 1: 3 hits in 4 AB -> Team AVG .750 (Won 10-5)
        { gameId: "g1", playerId: "p1", eventType: "single", runs: 1, rbi: 1 },
        { gameId: "g1", playerId: "p1", eventType: "out", runs: 0, rbi: 0 },
        { gameId: "g1", playerId: "p2", eventType: "homerun", runs: 1, rbi: 2 },
        { gameId: "g1", playerId: "p2", eventType: "single", runs: 1, rbi: 1 },

        // Game 2: 1 hit in 4 AB -> Cumulative 4 hits in 8 AB -> .500 (Lost 4-8)
        { gameId: "g2", playerId: "p1", eventType: "single", runs: 1, rbi: 0 },
        { gameId: "g2", playerId: "p1", eventType: "out", runs: 0, rbi: 0 },
        { gameId: "g2", playerId: "p2", eventType: "out", runs: 0, rbi: 0 },
        { gameId: "g2", playerId: "p2", eventType: "out", runs: 0, rbi: 0 },
    ];

    it("renders empty state placeholder when fewer than 2 games exist", () => {
        render(
            <SeasonProgressionChart
                logs={[{ gameId: "g1", playerId: "p1", eventType: "single" }]}
                games={[mockGames[0]]}
                players={mockPlayers}
            />,
        );

        expect(
            screen.getByText("Not Enough Season Game Data"),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/at least 2 logged games with hitting stats/i),
        ).toBeInTheDocument();
        expect(
            screen.queryByTestId("mantine-composite-chart"),
        ).not.toBeInTheDocument();
    });

    it("renders progression chart and summary metrics in 'All' mode by default", () => {
        render(
            <SeasonProgressionChart
                logs={mockLogs}
                games={mockGames}
                players={mockPlayers}
            />,
        );

        expect(
            screen.getByTestId("mantine-composite-chart"),
        ).toBeInTheDocument();
        expect(screen.getByTestId("data-count")).toHaveTextContent("2");
        expect(screen.getByTestId("series-count")).toHaveTextContent("5");
        expect(screen.getByTestId("first-series-name")).toHaveTextContent(
            "AVG",
        );
        expect(screen.getByTestId("with-y-axis")).toHaveTextContent("false");

        // Team record badge (1 win, 1 loss)
        expect(screen.getByText("Record: 1-1-0")).toBeInTheDocument();

        // KPI cards for All mode
        expect(screen.getByText("Team AVG")).toBeInTheDocument();
        expect(screen.getByText("Team OBP")).toBeInTheDocument();
        expect(screen.getByText("Team SLG")).toBeInTheDocument();
        expect(screen.getByText("Team OPS")).toBeInTheDocument();

        // Custom balanced legend items
        expect(screen.getAllByText("SLG").length).toBeGreaterThan(0);
        expect(screen.getAllByText("OBP").length).toBeGreaterThan(0);

        // Metric Glossary
        expect(screen.getByText("Metric Glossary")).toBeInTheDocument();

        // Tooltip rendered preview with outcome badge and single game stats
        expect(screen.getByText("vs Thunder")).toBeInTheDocument();
        expect(screen.getAllByText("W 10-5").length).toBeGreaterThan(0);
        expect(screen.getByText(/Game: 3\/4/i)).toBeInTheDocument();
    });

    it("switches to single metric view (e.g. AVG), showing composite series (bar + line), and KPIs", () => {
        render(
            <SeasonProgressionChart
                logs={mockLogs}
                games={mockGames}
                players={mockPlayers}
            />,
        );

        const avgTab = screen.getByRole("radio", { name: "AVG" });
        fireEvent.click(avgTab);

        // Series count is 2 (gameAVG bar + running AVG line), Y-axis active
        expect(screen.getByTestId("series-count")).toHaveTextContent("2");
        expect(screen.getByTestId("first-series-name")).toHaveTextContent(
            "gameAVG",
        );
        expect(screen.getByTestId("with-y-axis")).toHaveTextContent("true");
        // AVG rate domain max must never exceed 1.000
        expect(
            Number(screen.getByTestId("y-axis-domain-max").textContent),
        ).toBeLessThanOrEqual(1.0);

        // Hero row and secondary stats
        expect(
            screen.getByText("Current Team Batting Avg"),
        ).toBeInTheDocument();
        expect(screen.getByText("Best Game")).toBeInTheDocument();
        expect(screen.getByText("Lowest Game")).toBeInTheDocument();
        expect(screen.getByText("Net Trend")).toBeInTheDocument();

        // Metric Explainer card
        expect(screen.getByText("Hits / At-Bats")).toBeInTheDocument();
        expect(
            screen.getByText(/Measures hitting frequency/i),
        ).toBeInTheDocument();

        // Tooltip has both This Game and Cumulative
        expect(screen.getByText("This Game")).toBeInTheDocument();
        expect(screen.getByText("Cumulative")).toBeInTheDocument();
        expect(screen.getByText(/vs Avg/i)).toBeInTheDocument();
    });

    it("switches to ISO metric and shows ISO formula and explanation", () => {
        render(
            <SeasonProgressionChart
                logs={mockLogs}
                games={mockGames}
                players={mockPlayers}
            />,
        );

        const isoTab = screen.getByRole("radio", { name: "ISO" });
        fireEvent.click(isoTab);

        expect(screen.getByTestId("series-count")).toHaveTextContent("2");
        expect(screen.getByTestId("with-y-axis")).toHaveTextContent("true");
        expect(screen.getByText("Slugging - Batting Avg")).toBeInTheDocument();
        expect(
            screen.getByText(/Isolated Power measures pure extra-base thump/i),
        ).toBeInTheDocument();
    });

    it("switches across other metrics (OBP, SLG, OPS) and displays their respective formulas", () => {
        render(
            <SeasonProgressionChart
                logs={mockLogs}
                games={mockGames}
                players={mockPlayers}
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

    it("renders custom green dots for wins and red dots for losses on the chart", () => {
        render(
            <SeasonProgressionChart
                logs={mockLogs}
                games={mockGames}
                players={mockPlayers}
            />,
        );

        // Select a single metric to activate the line with outcome dots
        const avgTab = screen.getByRole("radio", { name: "AVG" });
        fireEvent.click(avgTab);

        const winDotGroup = screen.getByTestId("dot-W");
        const lossDotGroup = screen.getByTestId("dot-L");

        expect(winDotGroup).toBeInTheDocument();
        expect(lossDotGroup).toBeInTheDocument();

        const winCircle = winDotGroup.querySelector("circle");
        const lossCircle = lossDotGroup.querySelector("circle");

        expect(winCircle).toHaveAttribute("fill", "#20c997");
        expect(lossCircle).toHaveAttribute("fill", "#fa5252");
    });

    it("tracks season-trends-metric-changed Umami event", () => {
        jest.clearAllMocks();
        render(
            <SeasonProgressionChart
                seasonId="season-100"
                logs={mockLogs}
                games={mockGames}
                players={mockPlayers}
            />,
        );

        // Change metric to AVG
        fireEvent.click(screen.getByRole("radio", { name: "AVG" }));
        expect(trackEvent).toHaveBeenCalledWith(
            "season-trends-metric-changed",
            {
                seasonId: "season-100",
                metric: "AVG",
            },
        );

        // Change metric to OPS
        fireEvent.click(screen.getByRole("radio", { name: "OPS" }));
        expect(trackEvent).toHaveBeenCalledWith(
            "season-trends-metric-changed",
            {
                seasonId: "season-100",
                metric: "OPS",
            },
        );
    });
});
