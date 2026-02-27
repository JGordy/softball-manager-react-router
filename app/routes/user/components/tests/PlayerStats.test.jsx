import { render, screen, fireEvent } from "@/utils/test-utils";

import { UI_KEYS } from "@/constants/scoring";

import PlayerStats from "../PlayerStats";

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

jest.mock("@/components/ContactSprayChart", () => () => (
    <div data-testid="spray-chart" />
));

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
        logs: [
            {
                gameId: "g1",
                eventType: UI_KEYS.SINGLE,
                rbi: 1,
                angle: 90,
                distance: 100,
            },
            {
                gameId: "g1",
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
});
