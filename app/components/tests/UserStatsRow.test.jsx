import { render, screen } from "@/utils/test-utils";

import UserStatsRow from "../UserStatsRow";

describe("UserStatsRow Component", () => {
    const mockStats = {
        awardsCount: 5,
        teamCount: 3,
        gameCount: 12,
    };

    it("renders all stat values and labels", () => {
        render(<UserStatsRow stats={mockStats} />);

        // Check values
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("12")).toBeInTheDocument();

        // Check labels
        expect(screen.getByText("Awards")).toBeInTheDocument();
        expect(screen.getByText("Teams")).toBeInTheDocument();
        expect(screen.getByText("Games")).toBeInTheDocument();
    });

    it("renders zeros when stats are missing", () => {
        render(<UserStatsRow stats={null} />);

        const zeros = screen.getAllByText("0");
        expect(zeros).toHaveLength(3);
    });
});
