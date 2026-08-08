import { render, screen } from "@/utils/test-utils";
import PlayerRadarChart from "../PlayerRadarChart";

describe("PlayerRadarChart Component", () => {
    const mockOverallStats = {
        hits: 30,
        ab: 41,
        rbi: 25,
        runs: 20,
        doubles: 9,
        triples: 2,
        homeruns: 3,
        details: { BB: 2 },
        calculated: {
            avg: ".732",
            obp: ".727",
            slg: "1.268",
            ops: "1.995",
        },
    };

    it("renders hitting performance radar chart with metric badges and labels", () => {
        render(
            <PlayerRadarChart
                overallStats={mockOverallStats}
                gameCountWithLogs={12}
            />,
        );

        expect(screen.getByText("Player")).toBeInTheDocument();
        expect(screen.getByText("Player Avg")).toBeInTheDocument();

        // Metric cards
        expect(screen.getByText("Hits / Gm")).toBeInTheDocument();
        expect(screen.getByText("RBIs / Gm")).toBeInTheDocument();
        expect(screen.getByText("Runs / Gm")).toBeInTheDocument();
        expect(screen.getByText("AVG")).toBeInTheDocument();
        expect(screen.getByText("SLG")).toBeInTheDocument();
        expect(screen.getByText("OPS")).toBeInTheDocument();

        // Check logged games footnote
        expect(
            screen.getByText(/calculated across 12 logged game\(s\)/i),
        ).toBeInTheDocument();
    });

    it("returns null if gameCountWithLogs is 0", () => {
        render(
            <PlayerRadarChart
                overallStats={mockOverallStats}
                gameCountWithLogs={0}
            />,
        );

        expect(screen.queryByText("Player")).not.toBeInTheDocument();
    });
});
