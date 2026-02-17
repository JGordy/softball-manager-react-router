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
        expect(screen.getByText("2")).toBeInTheDocument(); // Inning

        // Verify inning indicator (top/bottom)
        expect(screen.getByLabelText("Top of inning")).toBeInTheDocument();

        // Verify outs indicator
        // The component uses aria-label="{outs} outs" on the container
        expect(screen.getByLabelText("1 outs")).toBeInTheDocument();
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
