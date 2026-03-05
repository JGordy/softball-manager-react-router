import { render, screen } from "@/utils/test-utils";
import CompactMatchupCard from "../CompactMatchupCard";

jest.mock("../DiamondView", () => () => <div data-testid="diamond-view" />);
jest.mock("../CurrentBatterCard", () => () => (
    <div data-testid="batter-card" />
));
jest.mock("../OnDeckCard", () => () => <div data-testid="ondeck-card" />);

describe("CompactMatchupCard", () => {
    const defaultProps = {
        score: 2,
        opponentScore: 1,
        inning: 3,
        halfInning: "top",
        outs: 1,
        teamName: "Home Team",
        opponentName: "Away Team",
        gameFinal: false,
        realtimeStatus: "connected",
        isOurBatting: true,
        runners: { first: true, second: false, third: false },
        currentBatter: { name: "John Doe" },
        onDeckBatter: { name: "Jane Doe" },
        logs: [],
    };

    it("renders team names and scores", () => {
        render(<CompactMatchupCard {...defaultProps} />);
        expect(screen.getByText("Home Team")).toBeInTheDocument();
        expect(screen.getByText("Away Team")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("renders game state when not final", () => {
        render(<CompactMatchupCard {...defaultProps} />);
        expect(screen.getByText("3")).toBeInTheDocument(); // inning
        expect(screen.getByText("Live")).toBeInTheDocument(); // realtime status
        expect(screen.getByTestId("diamond-view")).toBeInTheDocument();
    });

    it("renders FINAL badge when gameFinal is true", () => {
        render(<CompactMatchupCard {...defaultProps} gameFinal={true} />);
        expect(screen.getByText("FINAL")).toBeInTheDocument();
        expect(screen.queryByText("3")).not.toBeInTheDocument(); // inning
        expect(screen.queryByTestId("diamond-view")).not.toBeInTheDocument();
    });

    it("renders batter cards when isOurBatting is true", () => {
        render(<CompactMatchupCard {...defaultProps} />);
        expect(screen.getByTestId("batter-card")).toBeInTheDocument();
        expect(screen.getByTestId("ondeck-card")).toBeInTheDocument();
    });

    it("hides batter cards when isOurBatting is false", () => {
        render(<CompactMatchupCard {...defaultProps} isOurBatting={false} />);
        expect(screen.queryByTestId("batter-card")).not.toBeInTheDocument();
        expect(screen.queryByTestId("ondeck-card")).not.toBeInTheDocument();
    });
});
