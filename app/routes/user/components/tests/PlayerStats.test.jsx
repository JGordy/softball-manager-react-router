import { render, screen, fireEvent } from "@/utils/test-utils";

import { UI_KEYS } from "@/constants/scoring";

import PlayerStats from "../PlayerStats";
import ContactSprayChart from "@/components/ContactSprayChart";

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
        ({ children, opened }) =>
            opened ? <div data-testid="drawer">{children}</div> : null,
);

jest.mock("../stats/StatsDetailDrawer", () => () => (
    <div data-testid="stats-detail-drawer" />
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
        expect(screen.getByText("AVG")).toBeInTheDocument();
        expect(screen.getByText("View Spray Chart")).toBeInTheDocument();
    });

    it("opens spray chart drawer when button is clicked", () => {
        render(<PlayerStats statsPromise={mockStatsData} />);

        const sprayButton = screen.getByText("View Spray Chart");
        fireEvent.click(sprayButton);

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

        const sprayButton = screen.getByText("View Spray Chart");
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
