import { render, screen, fireEvent } from "@/utils/test-utils";

import { UI_KEYS } from "@/constants/scoring";

import PlayerStats from "../PlayerStats";
import ContactSprayChart from "@/components/ContactSprayChart";
import { trackEvent } from "@/utils/analytics";

jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
}));

jest.mock("@/components/DeferredLoader", () => ({
    __esModule: true,
    default: ({ resolve, children, fallback }) => {
        if (resolve === "pending") return fallback;
        return children(resolve);
    },
}));

jest.mock("@/components/ContactSprayChart", () => ({
    __esModule: true,
    default: jest.fn(() => <div data-testid="spray-chart" />),
}));

jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, opened, title }) =>
            opened ? (
                <div data-testid="drawer">
                    {title && <div>{title}</div>}
                    {children}
                </div>
            ) : null,
);

jest.mock("../stats/StatsDetailDrawer", () => () => (
    <div data-testid="stats-detail-drawer" />
));

jest.mock("../stats/PlayerProgressionChart", () => () => (
    <div data-testid="player-progression-chart" />
));

describe("PlayerStats Component", () => {
    const mockFetcher = {
        load: jest.fn(),
        state: "idle",
        data: null,
    };

    const mockStatsData = {
        userId: "player1",
        logs: [
            {
                gameId: "g1",
                playerId: "player1",
                eventType: UI_KEYS.SINGLE,
                rbi: 1,
                angle: 90,
                distance: 100,
            },
            {
                gameId: "g1",
                playerId: "player1",
                eventType: UI_KEYS.HOMERUN,
                rbi: 4,
                angle: 45,
                distance: 300,
            },
        ],
        games: [
            {
                $id: "g1",
                gameDate: "2023-10-15T18:00:00Z",
                teamId: "t1",
                opponent: "Lightning",
            },
        ],
        teams: [{ $id: "t1", name: "Thunder" }],
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders skeleton while loading", () => {
        const { container } = render(<PlayerStats statsPromise="pending" />);
        // Mantine Skeletons are rendered as divs with mantine-Skeleton-root class
        expect(
            container.querySelector(".mantine-Skeleton-root"),
        ).toBeInTheDocument();
    });

    it("renders no stats message if logs are empty", () => {
        const emptyData = { logs: [], games: [], teams: [] };
        render(<PlayerStats statsPromise={emptyData} />);
        expect(screen.getByText("No stats available yet.")).toBeInTheDocument();
    });

    it("renders stats overview when data is available", () => {
        render(<PlayerStats statsPromise={mockStatsData} />);

        expect(screen.getByText(/Last 1 Games/i)).toBeInTheDocument();
        expect(screen.getAllByText("AVG").length).toBeGreaterThan(0);
        expect(screen.getByText("Trends")).toBeInTheDocument();
        expect(screen.getByText("Performance")).toBeInTheDocument();
        expect(screen.getByText("Spray Chart")).toBeInTheDocument();
    });

    it("opens batting trends drawer and tracks player-trends-opened when Trends button is clicked", () => {
        render(<PlayerStats statsPromise={mockStatsData} />);

        const trendsButton = screen.getByText("Trends");
        fireEvent.click(trendsButton);

        expect(trackEvent).toHaveBeenCalledWith("player-trends-opened", {
            userId: "player1",
            gameCount: 1,
        });
        expect(screen.getByText("Batting Trends")).toBeInTheDocument();
        expect(
            screen.getByTestId("player-progression-chart"),
        ).toBeInTheDocument();
    });

    it("tracks player-trends-opened when clicking stats summary group", () => {
        render(<PlayerStats statsPromise={mockStatsData} />);

        const statsGroup = screen.getByTitle("Click to view stats over time");
        fireEvent.click(statsGroup);

        expect(trackEvent).toHaveBeenCalledWith("player-trends-opened", {
            userId: "player1",
            gameCount: 1,
        });
    });

    it("displays dynamic drawer title with game count when 2 or more games exist", () => {
        const multiGameData = {
            userId: "player1",
            logs: [
                ...mockStatsData.logs,
                {
                    gameId: "g2",
                    playerId: "player1",
                    eventType: UI_KEYS.SINGLE,
                    rbi: 1,
                    angle: 90,
                    distance: 150,
                },
            ],
            games: [
                ...mockStatsData.games,
                {
                    $id: "g2",
                    gameDate: "2026-09-20T14:00:00Z",
                    opponent: "Tigers",
                    teamId: "t1",
                },
            ],
            teams: mockStatsData.teams,
        };

        render(<PlayerStats statsPromise={multiGameData} />);

        const trendsButton = screen.getByText("Trends");
        fireEvent.click(trendsButton);

        expect(trackEvent).toHaveBeenCalledWith("player-trends-opened", {
            userId: "player1",
            gameCount: 2,
        });
        expect(
            screen.getByText("Batting Trends over 2 games"),
        ).toBeInTheDocument();
    });

    it("opens performance radar drawer and tracks player-radar-opened when button is clicked", () => {
        render(<PlayerStats statsPromise={mockStatsData} />);

        const radarButton = screen.getByText("Performance");
        fireEvent.click(radarButton);

        expect(trackEvent).toHaveBeenCalledWith("player-radar-opened", {
            userId: "player1",
            gameCount: 1,
        });
        expect(
            screen.getByText("Hitting Performance Radar"),
        ).toBeInTheDocument();
    });

    it("opens spray chart drawer and tracks player-spray-chart-opened when button is clicked", () => {
        render(<PlayerStats statsPromise={mockStatsData} />);

        const sprayButton = screen.getByText("Spray Chart");
        fireEvent.click(sprayButton);

        expect(trackEvent).toHaveBeenCalledWith("player-spray-chart-opened", {
            userId: "player1",
        });
        expect(screen.getByTestId("spray-chart")).toBeInTheDocument();
    });

    it("filters logs correctly to only pass the user's at-bats to the spray chart", () => {
        const complexData = {
            ...mockStatsData,
            logs: [
                ...mockStatsData.logs,
                {
                    gameId: "g1",
                    playerId: "player2",
                    eventType: UI_KEYS.DOUBLE,
                    rbi: 1,
                    scored: ["player1"], // user scored on someone else's hit
                },
            ],
        };
        render(<PlayerStats statsPromise={complexData} />);

        const sprayButton = screen.getByText("Spray Chart");
        fireEvent.click(sprayButton);

        // Ensure ContactSprayChart was called
        expect(ContactSprayChart).toHaveBeenCalled();

        // Get the props passed to ContactSprayChart in its most recent render
        const lastCall =
            ContactSprayChart.mock.calls[
                ContactSprayChart.mock.calls.length - 1
            ];
        const props = lastCall[0];

        // Should only include logs where playerId === "player1"
        expect(props.hits).toHaveLength(2); // mockStatsData has 2 hits for player1
        props.hits.forEach((hit) => {
            expect(hit.playerId).toBe("player1");
        });
    });
});
