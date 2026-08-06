import { render, screen } from "@/utils/test-utils";
import { GameLogsBreakdown } from "../GameLogsBreakdown";

jest.mock("@mantine/charts", () => ({
    SankeyChart: ({ data }) => (
        <div data-testid="sankey-chart">
            {data?.nodes?.map((node) => (
                <span key={node.name}>{node.name}</span>
            ))}
        </div>
    ),
}));

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

    it("renders play-by-play log totals and event flow chart", () => {
        render(<GameLogsBreakdown logsStats={mockLogsStats} />);
        expect(screen.getByText("Play-by-Play Flow")).toBeInTheDocument();
        expect(screen.getByTestId("sankey-chart")).toBeInTheDocument();
        expect(screen.getByText("All Plays")).toBeInTheDocument();
        expect(screen.getByText("Hits")).toBeInTheDocument();
        expect(screen.getByText("Outs")).toBeInTheDocument();
        expect(screen.getByText("Single (1B)")).toBeInTheDocument();
        expect(screen.getByText("Strikeout (K)")).toBeInTheDocument();
    });

    it("returns null if logsStats is missing", () => {
        render(<GameLogsBreakdown logsStats={null} />);
        expect(screen.queryByText("Play-by-Play Flow")).not.toBeInTheDocument();
    });
});
