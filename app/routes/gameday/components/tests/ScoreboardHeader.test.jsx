import { render, screen } from "@/utils/test-utils";
import ScoreboardHeader from "../ScoreboardHeader";

describe("ScoreboardHeader", () => {
    const defaultProps = {
        score: 5,
        opponentScore: 3,
        inning: 2,
        halfInning: "top",
        outs: 1,
        teamName: "Tigers",
        opponentName: "Bears",
        gameFinal: false,
        realtimeStatus: "connected",
    };

    it("renders team names and scores", () => {
        render(<ScoreboardHeader {...defaultProps} />);
        expect(screen.getByText("Tigers")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("Bears")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("renders inning and outs", () => {
        render(<ScoreboardHeader {...defaultProps} />);

        // New badge-based inning indicator
        expect(screen.getByText("TOP 2")).toBeInTheDocument();

        // Verify outs indicator
        expect(screen.getByLabelText("1 outs")).toBeInTheDocument();
        expect(screen.getByText("1 OUT")).toBeInTheDocument();
    });

    it("renders runner status indicators", () => {
        const runners = { first: true, second: false, third: true };
        render(<ScoreboardHeader {...defaultProps} runners={runners} />);

        expect(screen.getByLabelText("Runner status")).toBeInTheDocument();

        const firstBase = screen.getByLabelText("First base");
        const secondBase = screen.getByLabelText("Second base");
        const thirdBase = screen.getByLabelText("Third base");

        expect(firstBase).toBeInTheDocument();
        expect(secondBase).toBeInTheDocument();
        expect(thirdBase).toBeInTheDocument();

        // Verify active/inactive states via styles or opacity if possible,
        // but labels and presence are most important for accessibility.
    });

    it("renders FINAL badge when game is final", () => {
        // When game is final, realtimeStatus might be idle or disconnected
        render(
            <ScoreboardHeader
                {...defaultProps}
                gameFinal={true}
                realtimeStatus="idle"
            />,
        );
        expect(screen.getByText("FINAL")).toBeInTheDocument();
        expect(screen.queryByText("Live")).not.toBeInTheDocument();
    });

    it("renders Live badge when connected", () => {
        render(<ScoreboardHeader {...defaultProps} />);
        expect(screen.getByText("Live")).toBeInTheDocument();
    });

    it("renders Offline badge when error", () => {
        render(<ScoreboardHeader {...defaultProps} realtimeStatus="error" />);
        expect(screen.getByText("Offline")).toBeInTheDocument();
    });
});
