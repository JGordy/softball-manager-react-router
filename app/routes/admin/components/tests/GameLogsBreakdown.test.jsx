import { render, screen } from "@/utils/test-utils";
import { GameLogsBreakdown } from "../GameLogsBreakdown";

describe("GameLogsBreakdown", () => {
    const mockLogsStats = {
        total: 120,
        avgPerGame: "2.4",
        sampleSize: 2,
        byType: [
            { type: "single", label: "Single (1B)", count: 10, percentage: 50 },
            {
                type: "strikeout",
                label: "Strikeout (K)",
                count: 10,
                percentage: 50,
            },
        ],
    };

    it("renders play-by-play log totals and event distribution", () => {
        render(<GameLogsBreakdown logsStats={mockLogsStats} />);
        expect(screen.getByText("Play-by-Play Logs")).toBeInTheDocument();
        expect(screen.getByText("Single (1B)")).toBeInTheDocument();
        expect(screen.getByText("Strikeout (K)")).toBeInTheDocument();
        expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
    });

    it("returns null if logsStats is missing", () => {
        render(<GameLogsBreakdown logsStats={null} />);
        expect(screen.queryByText("Play-by-Play Logs")).not.toBeInTheDocument();
    });
});
