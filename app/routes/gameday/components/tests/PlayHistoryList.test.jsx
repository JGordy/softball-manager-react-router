import { render, screen, fireEvent } from "@/utils/test-utils";
import * as gamedayUtils from "../../utils/gamedayUtils";

import PlayHistoryList from "../PlayHistoryList";

jest.mock("../../utils/gamedayUtils");

describe("PlayHistoryList", () => {
    const mockLogs = [
        {
            $id: "log1",
            description: "Batter singles",
            rbi: 1,
            outsOnPlay: 0,
            inning: 1,
            halfInning: "top",
            baseState: "{}",
        },
        {
            $id: "log2",
            description: "Batter strikes out",
            rbi: 0,
            outsOnPlay: 1,
            inning: 1,
            halfInning: "top",
            baseState: "{}",
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        gamedayUtils.getRunnerMovement.mockReturnValue([]);
        gamedayUtils.isOpponentPlay.mockReturnValue(false);
    });

    it("renders logs in reverse order", () => {
        render(<PlayHistoryList logs={mockLogs} playerChart={[]} />);
        const items = screen.getAllByText(/Batter/);
        expect(items[0]).toHaveTextContent("Batter strikes out");
        expect(items[1]).toHaveTextContent("Batter singles");
    });

    it("renders RBI badge", () => {
        render(<PlayHistoryList logs={mockLogs} playerChart={[]} />);
        expect(screen.getByText("1 RBI")).toBeInTheDocument();
    });

    it("renders Out badge", () => {
        render(<PlayHistoryList logs={mockLogs} playerChart={[]} />);
        expect(screen.getByText("1 Out")).toBeInTheDocument();
    });

    it("renders empty state message", () => {
        render(<PlayHistoryList logs={[]} playerChart={[]} />);
        expect(
            screen.getByText("No plays logged yet for this game."),
        ).toBeInTheDocument();
    });

    it("renders runner movements", () => {
        gamedayUtils.getRunnerMovement.mockReturnValue(["Runner scores"]);
        render(<PlayHistoryList logs={[mockLogs[0]]} playerChart={[]} />);
        expect(screen.getByText("Runner scores")).toBeInTheDocument();
    });

    it("renders SUB event types with the sub description", () => {
        const subLog = {
            $id: "log3",
            description: "Jane D. enters for Joseph G. in slot 3",
            eventType: "SUB",
        };
        render(
            <PlayHistoryList logs={[...mockLogs, subLog]} playerChart={[]} />,
        );
        expect(
            screen.getByText("Jane D. enters for Joseph G. in slot 3"),
        ).toBeInTheDocument();
    });

    describe("edit play button", () => {
        it("does not show the edit button when isScorekeeper is false", () => {
            render(
                <PlayHistoryList
                    logs={mockLogs}
                    playerChart={[]}
                    isScorekeeper={false}
                    onEditPlay={jest.fn()}
                />,
            );
            expect(
                screen.queryByRole("button", { name: /edit play/i }),
            ).not.toBeInTheDocument();
        });

        it("shows an edit button for each non-SUB log when isScorekeeper is true", () => {
            render(
                <PlayHistoryList
                    logs={mockLogs}
                    playerChart={[]}
                    isScorekeeper={true}
                    onEditPlay={jest.fn()}
                />,
            );
            const editButtons = screen.getAllByRole("button", {
                name: /edit play/i,
            });
            expect(editButtons).toHaveLength(mockLogs.length);
        });

        it("calls onEditPlay with the correct log when the edit button is clicked", () => {
            const mockOnEditPlay = jest.fn();
            render(
                <PlayHistoryList
                    logs={[mockLogs[0]]}
                    playerChart={[]}
                    isScorekeeper={true}
                    onEditPlay={mockOnEditPlay}
                />,
            );
            fireEvent.click(screen.getByRole("button", { name: /edit play/i }));
            expect(mockOnEditPlay).toHaveBeenCalledTimes(1);
            expect(mockOnEditPlay).toHaveBeenCalledWith(mockLogs[0]);
        });

        it("does not show edit button on SUB log rows even for scorekeepers", () => {
            const subLog = {
                $id: "log-sub",
                description: "Jane D. enters for Joseph G. in slot 3",
                eventType: "SUB",
            };
            render(
                <PlayHistoryList
                    logs={[subLog]}
                    playerChart={[]}
                    isScorekeeper={true}
                    onEditPlay={jest.fn()}
                />,
            );
            expect(
                screen.queryByRole("button", { name: /edit play/i }),
            ).not.toBeInTheDocument();
        });

        it("does not show edit button on opponent_run log rows even for scorekeepers", () => {
            const opponentLog = {
                $id: "log-opp",
                description: "Trinity Red scored 2 runs",
                eventType: "opponent_run",
                rbi: 2,
                inning: 2,
                halfInning: "top",
            };
            render(
                <PlayHistoryList
                    logs={[opponentLog]}
                    playerChart={[]}
                    isScorekeeper={true}
                    onEditPlay={jest.fn()}
                />,
            );
            expect(
                screen.queryByRole("button", { name: /edit play/i }),
            ).not.toBeInTheDocument();
        });
    });

    it("renders opponent run event cards correctly with custom opponentName", () => {
        const opponentLog = {
            $id: "log-opp",
            eventType: "opponent_run",
            rbi: 2,
            inning: 2,
            halfInning: "top",
        };
        render(
            <PlayHistoryList
                logs={[opponentLog]}
                playerChart={[]}
                opponentName="Trinity Red"
            />,
        );
        expect(
            screen.getByText("Trinity Red scored 2 runs"),
        ).toBeInTheDocument();
    });

    it("applies opponent styling to normal plays if isOpponentPlay is true", () => {
        gamedayUtils.isOpponentPlay.mockReturnValue(true);
        const opponentLog = {
            $id: "log-opp-play",
            description: "Batter 2 walks",
            rbi: 0,
            inning: 1,
            halfInning: "top",
            baseState: "{}",
        };
        const { container } = render(
            <PlayHistoryList
                logs={[opponentLog]}
                playerChart={[]}
                isHomeGame={true}
            />,
        );

        const cardElement = container.querySelector(".mantine-Card-root");
        expect(cardElement).toBeInTheDocument();

        // Assert that the opponent style styles are applied (red border on right)
        expect(cardElement.style.borderRight).toBe(
            "1px solid var(--mantine-color-red-6)",
        );
        expect(cardElement.style.borderLeft).toBe("");
    });
});
