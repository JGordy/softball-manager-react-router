import { render, screen } from "@/utils/test-utils";
import { AILineupMetrics } from "../AILineupMetrics";

describe("AILineupMetrics", () => {
    const metrics = {
        requested: 100,
        generated: 80,
        applied: 40,
    };

    it("renders core funnel metrics correctly", () => {
        render(<AILineupMetrics aiLineupMetrics={metrics} range="24h" />);

        expect(screen.getByText(/AI Lineup Activity/i)).toBeInTheDocument();
        expect(screen.getByText("40%")).toBeInTheDocument(); // Overall success rate
        expect(screen.getByText(/80% SUCCESS/i)).toBeInTheDocument();
        expect(screen.getByText(/50% APPLIED/i)).toBeInTheDocument();

        expect(
            screen.getByText(/80 lineups created from 100 requests/i),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/40 of 80 suggestions used by managers/i),
        ).toBeInTheDocument();
    });

    it("handles zero values gracefully", () => {
        const zeroMetrics = {
            requested: 0,
            generated: 0,
            applied: 0,
        };
        render(<AILineupMetrics aiLineupMetrics={zeroMetrics} />);

        // Should find 0% in the ring label, and variations in the badges
        expect(screen.getByText("0%")).toBeInTheDocument();
        expect(screen.getByText(/0% SUCCESS/i)).toBeInTheDocument();
        expect(screen.getByText(/0% APPLIED/i)).toBeInTheDocument();
    });

    it("renders dynamic range labels correctly", () => {
        const { rerender } = render(
            <AILineupMetrics aiLineupMetrics={metrics} range="7d" />,
        );
        expect(screen.getByText(/AI Lineup Activity/i)).toBeInTheDocument();
        expect(screen.getByText(/7d/i)).toBeInTheDocument();

        rerender(<AILineupMetrics aiLineupMetrics={metrics} range="30d" />);
        expect(screen.getByText(/30d/i)).toBeInTheDocument();
    });

    it("returns null if no metrics are provided", () => {
        render(<AILineupMetrics aiLineupMetrics={null} />);
        // Use queryByText to ensure component content is not there
        expect(screen.queryByText(/AI Lineup Activity/i)).toBeNull();
    });
});
