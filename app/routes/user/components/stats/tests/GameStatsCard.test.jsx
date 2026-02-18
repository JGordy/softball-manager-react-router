import { DateTime } from "luxon";

import { render, screen, fireEvent } from "@/utils/test-utils";

import { UI_KEYS } from "@/constants/scoring";

import GameStatsCard from "../GameStatsCard";

const mockGame = {
    gameDate: "2023-10-15T18:00:00Z",
    team: { name: "Thunder" },
    opponent: "Lightning",
};

const mockLogs = [
    { eventType: UI_KEYS.SINGLE, rbi: 1 },
    { eventType: UI_KEYS.DOUBLE, rbi: 2 },
    { eventType: UI_KEYS.FLY_OUT, rbi: 0 },
];

const defaultProps = {
    game: mockGame,
    logs: mockLogs,
};

describe("GameStatsCard Component", () => {
    it("renders game overview and hits summary", () => {
        render(<GameStatsCard {...defaultProps} onClick={() => {}} />);

        expect(screen.getByText("Thunder vs Lightning")).toBeInTheDocument();
        expect(screen.getByText("2/3")).toBeInTheDocument(); // 2 hits (1B, 2B) out of 3 AB
        expect(screen.getByText("[2B]")).toBeInTheDocument();
        expect(screen.getByText("3 RBI")).toBeInTheDocument();
    });

    it("renders correctly formatted date", () => {
        render(<GameStatsCard {...defaultProps} onClick={() => {}} />);

        const expectedDate = DateTime.fromISO(mockGame.gameDate).toLocaleString(
            DateTime.DATE_MED,
        );
        expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });

    it("calls onClick when clicked", () => {
        const handleClick = jest.fn();
        render(<GameStatsCard {...defaultProps} onClick={handleClick} />);

        fireEvent.click(screen.getByRole("button"));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("handles multiple extra base hits in summary text", () => {
        const extraLogs = [{ eventType: "2B" }, { eventType: "HR" }];
        render(
            <GameStatsCard
                {...defaultProps}
                logs={extraLogs}
                onClick={() => {}}
            />,
        );

        expect(screen.getByText("[2B, HR]")).toBeInTheDocument();
    });
});
