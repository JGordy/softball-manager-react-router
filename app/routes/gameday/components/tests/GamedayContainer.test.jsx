import { render, screen, waitFor, fireEvent } from "@/utils/test-utils";
import * as gameUpdatesHook from "@/hooks/useGameUpdates";
import * as gameStateHook from "../../hooks/useGameState";

import GamedayContainer from "../GamedayContainer";

// Mock child components to isolate GamedayContainer logic
jest.mock("../ScoreboardHeader", () => () => (
    <div data-testid="scoreboard-header" />
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

describe("GamedayContainer", () => {
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
            <GamedayContainer
                game={mockGame}
                playerChart={mockPlayerChart}
                team={mockTeam}
                initialLogs={[]}
                canScore={true}
            />,
        );

        expect(screen.getByTestId("scoreboard-header")).toBeInTheDocument();
        expect(screen.getByTestId("diamond-view")).toBeInTheDocument();
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
            <GamedayContainer
                game={mockGame}
                playerChart={mockPlayerChart}
                team={mockTeam}
                initialLogs={[]}
                canScore={true}
            />,
        );

        expect(screen.getByTestId("fielding-controls")).toBeInTheDocument();
        expect(screen.queryByTestId("action-pad")).not.toBeInTheDocument();
    });

    it("switches tabs correctly", async () => {
        render(
            <GamedayContainer
                game={mockGame}
                playerChart={mockPlayerChart}
                team={mockTeam}
                initialLogs={[]}
            />,
        );

        // Default tab is 'Live'
        expect(screen.getByTestId("diamond-view")).toBeInTheDocument();

        // Click on 'Plays' tab
        const playsTab = screen.getByText("Plays");
        fireEvent.click(playsTab);

        await waitFor(() => {
            expect(screen.getByTestId("play-history")).toBeVisible();
        });

        // Click on 'Box Score' tab
        const boxScoreTab = screen.getByText("Box Score");
        fireEvent.click(boxScoreTab);

        await waitFor(() => {
            expect(screen.getByTestId("box-score")).toBeVisible();
        });
    });
});
