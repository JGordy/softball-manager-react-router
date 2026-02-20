import { render, screen } from "@/utils/test-utils";
import { KPIGrid } from "../KPIGrid";

describe("KPIGrid", () => {
    const stats = {
        totalUsers: 1500,
        totalTeams: 42,
        totalGames: 300,
        activeUsers: 7,
    };

    it("renders all KPI values", () => {
        render(<KPIGrid stats={stats} />);

        expect(screen.getByText("Total Users")).toBeInTheDocument();
        expect(screen.getByText("1,500")).toBeInTheDocument();
        expect(screen.getByText("Total Teams")).toBeInTheDocument();
        expect(screen.getByText("42")).toBeInTheDocument();
        expect(screen.getByText("Live Visitors")).toBeInTheDocument();
        expect(screen.getByText("7")).toBeInTheDocument();
    });

    it("handles zero values", () => {
        render(
            <KPIGrid
                stats={{
                    totalUsers: 0,
                    totalTeams: 0,
                    totalGames: 0,
                    activeUsers: 0,
                }}
            />,
        );

        expect(screen.getAllByText("0")).toHaveLength(4);
    });
});
