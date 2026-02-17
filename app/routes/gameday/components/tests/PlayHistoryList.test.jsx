import { render, screen } from "@/utils/test-utils";
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
});
