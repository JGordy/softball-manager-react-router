import { render, screen, waitFor, fireEvent } from "@/utils/test-utils";
import * as gameUpdatesHook from "@/hooks/useGameUpdates";
import * as gameStateHook from "../../hooks/useGameState";

import DesktopGamedayContainer from "../DesktopGamedayContainer";

// Mock child components to isolate DesktopGamedayContainer logic
jest.mock("../CompactMatchupCard", () => () => (
    <div data-testid="compact-matchup-card" />
));
jest.mock("../DiamondView", () => () => <div data-testid="diamond-view" />);
jest.mock("../ActionPad", () => () => <div data-testid="action-pad" />);
jest.mock("../PlayHistoryList", () => () => <div data-testid="play-history" />);
jest.mock("../PlayActionDrawer", () => () => <div data-testid="play-drawer" />);
jest.mock("../CurrentBatterCard", () => () => (
    <div data-testid="batter-card" />
));
jest.mock("../DefenseCard", () => () => <div data-testid="defense-card" />);
jest.mock("../LastPlayCard", () => () => <div data-testid="last-play" />);
jest.mock("../FieldingControls", () => () => (
    <div data-testid="fielding-controls" />
));
jest.mock("../BoxScore", () => () => <div data-testid="box-score" />);
jest.mock("../OnDeckCard", () => () => <div data-testid="ondeck-card" />);
jest.mock("@/components/ContactSprayChart", () => () => (
    <div data-testid="spray-chart" />
));

// Mock hooks
jest.mock("react-router", () => ({
    useFetcher: () => ({ submit: jest.fn(), state: "idle" }),
    useLocation: () => ({ hash: "", pathname: "/gameday", search: "" }),
    useNavigate: () => jest.fn(),
}));

jest.mock("@/hooks/useGameUpdates");
jest.mock("../../hooks/useGameState");

describe("DesktopGamedayContainer", () => {
    const mockGame = {
        $id: "game123",
        gameDate: "2023-01-01",
        score: 0,
        opponentScore: 0,
    };
    const mockTeam = { name: "Tigers" };
    const mockPlayerChart = [
        { $id: "p1", firstName: "Alice" },
        { $id: "p2", firstName: "Bob" },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        gameUpdatesHook.useGameUpdates.mockReturnValue({
            status: "connected",
        });

        gameStateHook.useGameState.mockReturnValue({
            inning: 1,
            halfInning: "top",
            outs: 0,
            score: 0,
            opponentScore: 0,
            runners: { first: null, second: null, third: null },
            battingOrderIndex: 0,
        });
    });

    it("renders main components", () => {
        render(
            <DesktopGamedayContainer
                game={mockGame}
                playerChart={mockPlayerChart}
                team={mockTeam}
                initialLogs={[]}
                isScorekeeper={true}
            />,
        );

        expect(screen.getByTestId("compact-matchup-card")).toBeInTheDocument();
        // Since we are batting, we expect ActionPad
        expect(screen.getByTestId("action-pad")).toBeInTheDocument();
        expect(
            screen.queryByTestId("fielding-controls"),
        ).not.toBeInTheDocument();
    });

    it("renders fielding controls when on defense", () => {
        gameStateHook.useGameState.mockReturnValue({
            inning: 1,
            halfInning: "bottom",
            outs: 0,
            score: 0,
            opponentScore: 0,
            runners: { first: null, second: null, third: null },
            battingOrderIndex: 0,
        });

        render(
            <DesktopGamedayContainer
                game={mockGame}
                playerChart={mockPlayerChart}
                team={mockTeam}
                initialLogs={[]}
                isScorekeeper={true}
            />,
        );

        expect(screen.getByTestId("fielding-controls")).toBeInTheDocument();
        expect(screen.queryByTestId("action-pad")).not.toBeInTheDocument();
    });

    it("switches tabs correctly", async () => {
        render(
            <DesktopGamedayContainer
                game={mockGame}
                playerChart={mockPlayerChart}
                team={mockTeam}
                initialLogs={[]}
            />,
        );

        // Click on 'Box Score' tab
        const boxScoreTab = screen.getByText("Box Score");
        fireEvent.click(boxScoreTab);

        await waitFor(() => {
            expect(screen.getByTestId("box-score")).toBeVisible();
        });

        // Click on 'Spray Chart' tab
        const sprayChartTab = screen.getByText("Spray Chart");
        fireEvent.click(sprayChartTab);

        await waitFor(() => {
            expect(screen.getByTestId("spray-chart")).toBeVisible();
        });
    });
});
