import { render, screen, waitFor, fireEvent } from "@/utils/test-utils";
import * as gameUpdatesHook from "@/hooks/useGameUpdates";
import * as gameStateHook from "../../hooks/useGameState";

import DesktopGamedayContainer from "../DesktopGamedayContainer";

jest.mock("../DesktopPlayActionDrawer", () => () => (
    <div data-testid="play-drawer" />
));

jest.mock("../SubPlayerModal", () => () => (
    <div data-testid="sub-player-modal" />
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
        { $id: "p1", firstName: "Alice", lastName: "Smith" },
        { $id: "p2", firstName: "Bob", lastName: "Johnson" },
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

        expect(screen.getByText("Opponent")).toBeInTheDocument();
        expect(screen.getByTestId("sub-player-modal")).toBeInTheDocument();
        // Since we are batting, we expect ActionPad
        expect(screen.getByText("ON BASE")).toBeInTheDocument();
        expect(screen.queryByText("FIELDING CONTROLS")).not.toBeInTheDocument();
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

        expect(screen.getByText("FIELDING CONTROLS")).toBeInTheDocument();
        expect(screen.queryByText("ON BASE")).not.toBeInTheDocument();
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
            expect(screen.getByText("TOTALS")).toBeVisible();
        });

        // Click on 'Spray Chart' tab
        const sprayChartTab = screen.getByRole("tab", { name: "Spray Chart" });
        fireEvent.click(sprayChartTab);

        await waitFor(() => {
            expect(screen.getByText("Legend")).toBeVisible();
        });
    });
});
