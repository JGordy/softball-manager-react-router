/* eslint-disable react/display-name */
import { render, screen, waitFor, fireEvent, within } from "@/utils/test-utils";
import * as gameUpdatesHook from "@/hooks/useGameUpdates";
import * as gameStateHook from "../../hooks/useGameState";

import DesktopGamedayContainer from "../DesktopGamedayContainer";

jest.mock("../DesktopPlayActionDrawer", () => () => (
    <div data-testid="play-drawer" />
));

jest.mock("../SubPlayerDrawer", () => () => (
    <div data-testid="sub-player-modal" />
));

jest.mock(
    "../EditPlayDrawer",
    () =>
        ({ opened }) =>
            opened ? <div data-testid="edit-play-drawer">Edit Play</div> : null,
);

// Mock hooks
jest.mock("react-router", () => ({
    useFetcher: () => ({ submit: jest.fn(), state: "idle" }),
    useLocation: () => ({ hash: "", pathname: "/gameday", search: "" }),
    useNavigate: () => jest.fn(),
    useParams: () => ({ eventId: "game123" }),
    Link: ({ to, children, ...props }) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
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

        expect(screen.getAllByText("Opponent")[0]).toBeInTheDocument();
        expect(screen.getByTestId("sub-player-modal")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /share page/i }),
        ).toBeInTheDocument();
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
                game={{ ...mockGame, opponentScoringMode: "Basic" }}
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
                <DesktopGamedayContainer
                    game={mockGame}
                    gameFinal={true}
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
                <DesktopGamedayContainer
                    game={mockGame}
                    gameFinal={true}
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
                <DesktopGamedayContainer
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
                const panel = screen.getByRole("tabpanel");
                expect(within(panel).getByText("Power Hitter")).toBeVisible();
                expect(within(panel).getByText("Alice Smith")).toBeVisible();
            });
        });
    });

    describe("Edit Play integration", () => {
        const mockLogs = [
            {
                $id: "log1",
                description: "Alice Smith singles",
                eventType: "single",
                rbi: 0,
                outsOnPlay: 0,
                inning: 1,
                halfInning: "top",
                baseState: "{}",
            },
        ];

        it("opens the EditPlayDrawer when onEditPlay is triggered from history list", async () => {
            render(
                <DesktopGamedayContainer
                    game={mockGame}
                    playerChart={mockPlayerChart}
                    team={mockTeam}
                    initialLogs={mockLogs}
                    isScorekeeper={true}
                />,
            );

            // Go to Plays tab
            fireEvent.click(screen.getByText("Plays"));

            // Find the edit button (pencil icon)
            const editBtn = await screen.findByRole("button", {
                name: /edit play/i,
            });
            fireEvent.click(editBtn);

            // Verify drawer content (title is in EditPlayDrawer)
            expect(await screen.findByText("Edit Play")).toBeInTheDocument();
        });
    });

    describe("Empty lineup UI features", () => {
        it("renders page header and Lineup Required card, and shows Create Lineup CTA for scorekeepers", () => {
            render(
                <DesktopGamedayContainer
                    game={mockGame}
                    playerChart={[]}
                    team={mockTeam}
                    initialLogs={[]}
                    isScorekeeper={true}
                />,
            );

            // Verify header remains visible
            expect(screen.getByText("Scoring & Stats")).toBeInTheDocument();
            expect(
                screen.getByRole("button", { name: "Back" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("button", { name: /share page/i }),
            ).toBeInTheDocument();

            // Verify Lineup Required notice and Create Lineup button
            expect(screen.getByText("Lineup Required")).toBeInTheDocument();
            expect(
                screen.getByText("You must create a lineup before scoring."),
            ).toBeInTheDocument();

            const createLineupBtn = screen.getByRole("link", {
                name: /create lineup/i,
            });
            expect(createLineupBtn).toBeInTheDocument();
            expect(createLineupBtn).toHaveAttribute(
                "href",
                "/events/game123/lineup",
            );
        });

        it("renders page header and Lineup Required card, but hides Create Lineup CTA for non-scorekeepers", () => {
            render(
                <DesktopGamedayContainer
                    game={mockGame}
                    playerChart={[]}
                    team={mockTeam}
                    initialLogs={[]}
                    isScorekeeper={false}
                />,
            );

            // Verify header remains visible
            expect(screen.getByText("Scoring & Stats")).toBeInTheDocument();

            // Verify Lineup Required notice
            expect(screen.getByText("Lineup Required")).toBeInTheDocument();
            expect(
                screen.queryByRole("link", { name: /create lineup/i }),
            ).not.toBeInTheDocument();
        });
    });

    describe("LastPlayCard rendering", () => {
        const mockLogs = [
            {
                $id: "log1",
                description: "Alice Smith singles",
                eventType: "single",
                rbi: 0,
                outsOnPlay: 0,
                inning: 1,
                halfInning: "top",
                baseState: "{}",
            },
        ];

        it("renders LastPlayCard when batting", () => {
            gameStateHook.useGameState.mockReturnValue({
                inning: 1,
                halfInning: "top",
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
                    initialLogs={mockLogs}
                    isScorekeeper={true}
                />,
            );

            expect(screen.getByText("Last Play")).toBeInTheDocument();
            expect(
                screen.getAllByText("Alice Smith singles").length,
            ).toBeGreaterThan(0);
        });

        it("renders LastPlayCard when on defense", () => {
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
                    initialLogs={mockLogs}
                    isScorekeeper={true}
                />,
            );

            expect(screen.getByText("Last Play")).toBeInTheDocument();
            expect(
                screen.getAllByText("Alice Smith singles").length,
            ).toBeGreaterThan(0);
        });
    });
});
