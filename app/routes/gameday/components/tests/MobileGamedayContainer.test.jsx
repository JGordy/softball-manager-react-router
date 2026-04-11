import { render, screen, waitFor, fireEvent } from "@/utils/test-utils";
import * as gameUpdatesHook from "@/hooks/useGameUpdates";
import * as gameStateHook from "../../hooks/useGameState";

import MobileGamedayContainer from "../MobileGamedayContainer";

jest.mock("../MobilePlayActionDrawer", () => () => (
    <div data-testid="play-drawer" />
));

jest.mock("../SubPlayerDrawer", () => () => (
    <div data-testid="sub-player-modal" />
));

// Mock hooks
jest.mock("react-router", () => ({
    useFetcher: () => ({ submit: jest.fn(), state: "idle" }),
    useLocation: () => ({ hash: "", pathname: "/gameday", search: "" }),
    useNavigate: () => jest.fn(),
    useParams: () => ({ eventId: "game123" }),
}));

jest.mock("@/hooks/useGameUpdates");
jest.mock("../../hooks/useGameState");

describe("MobileGamedayContainer", () => {
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
            <MobileGamedayContainer
                game={mockGame}
                playerChart={mockPlayerChart}
                team={mockTeam}
                initialLogs={[]}
                isScorekeeper={true}
            />,
        );

        expect(screen.getByText("Tigers")).toBeInTheDocument();
        expect(screen.getByLabelText("Runner status")).toBeInTheDocument();
        expect(screen.getByTestId("sub-player-modal")).toBeInTheDocument();
        // Since we are batting, we expect ActionPad
        expect(screen.getByRole("button", { name: "1B" })).toBeInTheDocument();
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
            <MobileGamedayContainer
                game={mockGame}
                playerChart={mockPlayerChart}
                team={mockTeam}
                initialLogs={[]}
                isScorekeeper={true}
            />,
        );

        expect(screen.getByText("FIELDING CONTROLS")).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "1B" }),
        ).not.toBeInTheDocument();
    });

    it("switches tabs correctly", async () => {
        render(
            <MobileGamedayContainer
                game={mockGame}
                playerChart={mockPlayerChart}
                team={mockTeam}
                initialLogs={[]}
            />,
        );

        // Default tab is 'Live'
        expect(screen.getByLabelText("Runner status")).toBeInTheDocument();

        // Click on 'Plays' tab
        const playsTab = screen.getByText("Plays");
        fireEvent.click(playsTab);

        await waitFor(() => {
            expect(
                screen.getByText("No plays logged yet for this game."),
            ).toBeVisible();
        });

        // Click on 'Box Score' tab
        const boxScoreTab = screen.getByText("Box Score");
        fireEvent.click(boxScoreTab);

        await waitFor(() => {
            expect(screen.getByText("TOTALS")).toBeVisible();
        });
    });

    describe("Achievements integration", () => {
        const mockAchievements = [
            {
                $id: "ua1",
                userId: "p1",
                achievementId: "ach1",
                $createdAt: "2024-01-01T12:00:00Z",
                achievement: {
                    name: "Power Hitter",
                    rarity: "epic",
                    description: "Hit a HR",
                },
            },
        ];

        it("shows Achievements tab when game is final", () => {
            render(
                <MobileGamedayContainer
                    game={{ ...mockGame, gameFinal: true }}
                    playerChart={mockPlayerChart}
                    team={mockTeam}
                    initialLogs={[]}
                    achievements={[]}
                />,
            );

            expect(screen.getByText("Achievements")).toBeInTheDocument();
        });

        it("renders empty state when no achievements were earned", async () => {
            render(
                <MobileGamedayContainer
                    game={{ ...mockGame, gameFinal: true }}
                    playerChart={mockPlayerChart}
                    team={mockTeam}
                    initialLogs={[]}
                    achievements={[]}
                />,
            );

            fireEvent.click(screen.getByText("Achievements"));

            await waitFor(() => {
                expect(
                    screen.getByText(/No achievements earned yet/i),
                ).toBeVisible();
            });
        });

        it("renders achievement cards with player names", async () => {
            render(
                <MobileGamedayContainer
                    game={mockGame}
                    gameFinal={true}
                    playerChart={mockPlayerChart}
                    team={mockTeam}
                    initialLogs={[]}
                    achievements={mockAchievements}
                    players={mockPlayerChart}
                />,
            );

            fireEvent.click(screen.getByText("Achievements"));

            await waitFor(() => {
                expect(screen.getByText("Power Hitter")).toBeVisible();
                expect(screen.getByText("Alice Smith")).toBeVisible();
            });
        });
    });
});
