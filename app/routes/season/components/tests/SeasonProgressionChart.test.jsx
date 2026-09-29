import { render, screen, fireEvent } from "@/utils/test-utils";
import SeasonProgressionChart from "../SeasonProgressionChart";
import { trackEvent } from "@/utils/analytics";

jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

// Mock @mantine/charts AreaChart
jest.mock("@mantine/charts", () => ({
    AreaChart: ({
        data,
        series,
        withYAxis,
        tooltipProps,
        referenceLines,
        areaProps,
    }) => (
        <div data-testid="mantine-area-chart">
            <span data-testid="series-count">{series.length}</span>
            <span data-testid="data-count">{data.length}</span>
            <span data-testid="with-y-axis">{String(withYAxis)}</span>
            <span data-testid="reference-lines-count">
                {referenceLines ? referenceLines.length : 0}
            </span>
            <span data-testid="first-series-name">{series[0]?.name || ""}</span>
            {areaProps?.dot && data.length > 0 && (
                <svg data-testid="custom-dots-svg">
                    {data.map((item, index) => (
                        <g
                            key={item.gameId || index}
                            data-testid={`dot-${item.outcome}`}
                        >
                            {areaProps.dot({
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
            screen.queryByTestId("mantine-area-chart"),
        ).not.toBeInTheDocument();
    });

    it("renders in 'Per Game' mode by default with single-game series and KPI cards", () => {
        render(
            <SeasonProgressionChart
                logs={mockLogs}
                games={mockGames}
                players={mockPlayers}
            />,
        );

        expect(screen.getByTestId("mantine-area-chart")).toBeInTheDocument();
        expect(screen.getByTestId("data-count")).toHaveTextContent("2");
        expect(screen.getByTestId("series-count")).toHaveTextContent("5");
        expect(screen.getByTestId("first-series-name")).toHaveTextContent(
            "gameAVG",
        );
        expect(screen.getByTestId("with-y-axis")).toHaveTextContent("false");

        // View mode toggle options exist and "Per Game" is checked
        expect(screen.getByRole("radio", { name: "Per Game" })).toBeChecked();
        expect(
            screen.getByRole("radio", { name: "Cumulative" }),
        ).not.toBeChecked();

        // Team record badge (1 win, 1 loss)
        expect(screen.getByText("Record: 1-1-0")).toBeInTheDocument();

        // KPI cards for All mode in game view
        expect(screen.getByText("Season AVG")).toBeInTheDocument();
        expect(screen.getByText("Season OBP")).toBeInTheDocument();
        expect(screen.getByText("Season SLG")).toBeInTheDocument();
        expect(screen.getByText("Season OPS")).toBeInTheDocument();

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

    it("switches to single metric view (e.g. AVG) in default Per Game mode, showing season average reference line", () => {
        render(
            <SeasonProgressionChart
                logs={mockLogs}
                games={mockGames}
                players={mockPlayers}
            />,
        );

        const avgTab = screen.getByRole("radio", { name: "AVG" });
        fireEvent.click(avgTab);

        // Series count is 1, series name is gameAVG, Y-axis active, reference line active
        expect(screen.getByTestId("series-count")).toHaveTextContent("1");
        expect(screen.getByTestId("first-series-name")).toHaveTextContent(
            "gameAVG",
        );
        expect(screen.getByTestId("with-y-axis")).toHaveTextContent("true");
        expect(screen.getByTestId("reference-lines-count")).toHaveTextContent(
            "1",
        );

        // Hero row and secondary stats for single game mode
        expect(screen.getByText("Season Batting Avg")).toBeInTheDocument();
        expect(screen.getByText("Best Game")).toBeInTheDocument();
        expect(screen.getByText("Lowest Game")).toBeInTheDocument();
        expect(screen.getByText("Latest Game")).toBeInTheDocument();

        // Metric Explainer card
        expect(screen.getByText("Hits / At-Bats")).toBeInTheDocument();
        expect(
            screen.getByText(/Measures hitting frequency/i),
        ).toBeInTheDocument();

        // Tooltip has single-game delta vs average
        expect(screen.getByText("Game Output")).toBeInTheDocument();
        expect(screen.getByText(/vs Avg/i)).toBeInTheDocument();
    });

    it("toggles to Cumulative mode and updates series, KPIs, and tooltip", () => {
        render(
            <SeasonProgressionChart
                logs={mockLogs}
                games={mockGames}
                players={mockPlayers}
            />,
        );

        // Switch view mode to Cumulative
        const cumulativeToggle = screen.getByRole("radio", {
            name: "Cumulative",
        });
        fireEvent.click(cumulativeToggle);
        expect(cumulativeToggle).toBeChecked();

        // Select AVG metric
        const avgTab = screen.getByRole("radio", { name: "AVG" });
        fireEvent.click(avgTab);

        // Series name becomes AVG (not gameAVG) and reference line is 0
        expect(screen.getByTestId("series-count")).toHaveTextContent("1");
        expect(screen.getByTestId("first-series-name")).toHaveTextContent(
            "AVG",
        );
        expect(screen.getByTestId("reference-lines-count")).toHaveTextContent(
            "0",
        );

        // Hero row and cumulative secondary stats
        expect(
            screen.getByText("Current Team Batting Avg"),
        ).toBeInTheDocument();
        expect(screen.getByText("High")).toBeInTheDocument();
        expect(screen.getByText("Low")).toBeInTheDocument();
        expect(screen.getByText("Net Trend")).toBeInTheDocument();

        // Game 1 team AVG was .750, Game 2 cumulative drops to .500 (-0.250)
        expect(screen.getByText("-0.250")).toBeInTheDocument();

        // Tooltip shows cumulative rate
        expect(screen.getByTestId("tooltip-preview")).toHaveTextContent(
            "Cumulative",
        );
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

        expect(screen.getByTestId("series-count")).toHaveTextContent("1");
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

        const winDotGroup = screen.getByTestId("dot-W");
        const lossDotGroup = screen.getByTestId("dot-L");

        expect(winDotGroup).toBeInTheDocument();
        expect(lossDotGroup).toBeInTheDocument();

        const winCircle = winDotGroup.querySelector("circle");
        const lossCircle = lossDotGroup.querySelector("circle");

        expect(winCircle).toHaveAttribute("fill", "#20c997");
        expect(lossCircle).toHaveAttribute("fill", "#fa5252");
    });

    it("tracks season-trends-mode-changed and season-trends-metric-changed Umami events", () => {
        jest.clearAllMocks();
        render(
            <SeasonProgressionChart
                seasonId="season-100"
                logs={mockLogs}
                games={mockGames}
                players={mockPlayers}
            />,
        );

        // 1. Change metric to AVG while in default Per Game mode
        fireEvent.click(screen.getByRole("radio", { name: "AVG" }));
        expect(trackEvent).toHaveBeenCalledWith(
            "season-trends-metric-changed",
            {
                seasonId: "season-100",
                metric: "AVG",
                viewMode: "game",
            },
        );

        // 2. Change view mode to Cumulative
        fireEvent.click(screen.getByRole("radio", { name: "Cumulative" }));
        expect(trackEvent).toHaveBeenCalledWith("season-trends-mode-changed", {
            seasonId: "season-100",
            viewMode: "cumulative",
        });

        // 3. Change metric to OBP while in Cumulative mode
        fireEvent.click(screen.getByRole("radio", { name: "OBP" }));
        expect(trackEvent).toHaveBeenCalledWith(
            "season-trends-metric-changed",
            {
                seasonId: "season-100",
                metric: "OBP",
                viewMode: "cumulative",
            },
        );
    });
});
