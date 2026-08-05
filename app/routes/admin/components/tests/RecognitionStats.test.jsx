import { render, screen } from "@/utils/test-utils";
import { RecognitionStats } from "../RecognitionStats";

describe("RecognitionStats", () => {
    const mockStats = {
        votes: { total: 45, perGame: "0.9" },
        awards: { total: 12, perGame: "0.2" },
        achievements: { total: 30, perGame: "0.6" },
    };

    it("renders vote, award, and achievement totals with per-game averages", () => {
        render(<RecognitionStats stats={mockStats} />);
        expect(screen.getByText("Game Votes")).toBeInTheDocument();
        expect(screen.getByText("45")).toBeInTheDocument();
        expect(screen.getByText("0.9 / game")).toBeInTheDocument();

        expect(screen.getByText("Game Awards")).toBeInTheDocument();
        expect(screen.getByText("12")).toBeInTheDocument();
        expect(screen.getByText("0.2 / game")).toBeInTheDocument();

        expect(screen.getByText("Achievements")).toBeInTheDocument();
        expect(screen.getByText("30")).toBeInTheDocument();
        expect(screen.getByText("0.6 / game")).toBeInTheDocument();
    });

    it("returns null if stats is missing", () => {
        render(<RecognitionStats stats={null} />);
        expect(screen.queryByText("Game Votes")).not.toBeInTheDocument();
    });
});
