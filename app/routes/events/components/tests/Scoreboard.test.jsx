import { render, screen } from "@/utils/test-utils";
import Scoreboard from "../Scoreboard";

describe("Scoreboard Component", () => {
    const defaultProps = {
        game: {
            score: 5,
            opponentScore: 3,
            opponent: "Bad News Bears",
            isHomeGame: true,
            result: "won",
        },
        gameIsPast: true,
        gameInProgress: false,
        team: { name: "My Team" },
    };

    it("renders team names correctly for home game", () => {
        render(<Scoreboard {...defaultProps} isHomeGame={true} />);
        // "My Team vs Bad News Bears"
        expect(
            screen.getByText(/My Team vs Bad News Bears/),
        ).toBeInTheDocument();
    });

    it("renders team names correctly for away game", () => {
        const props = {
            ...defaultProps,
            game: {
                ...defaultProps.game,
                isHomeGame: false,
                opponent: "Away Team",
            },
        };
        render(<Scoreboard {...props} />);
        // "My Team @ Away Team"
        expect(screen.getByText(/My Team @ Away Team/)).toBeInTheDocument();
    });

    it("renders scores correctly", () => {
        render(<Scoreboard {...defaultProps} />);
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("renders scores as 0 if undefined", () => {
        const props = {
            ...defaultProps,
            game: {
                ...defaultProps.game,
                score: undefined,
                opponentScore: undefined,
            },
        };
        render(<Scoreboard {...props} />);
        // Since getByText("0") will find two elements, getAllByText
        expect(screen.getAllByText("0")).toHaveLength(2);
    });

    it("shows 'Game is live!' when gameInProgress is true", () => {
        render(<Scoreboard {...defaultProps} gameInProgress={true} />);
        expect(screen.getByText("Game is live!")).toBeInTheDocument();
    });

    it("shows 'Game result pending' when game is past but no result", () => {
        const props = {
            ...defaultProps,
            game: { ...defaultProps.game, result: null },
            gameIsPast: true,
        };
        render(<Scoreboard {...props} />);
        expect(screen.getByText("Game result pending*")).toBeInTheDocument();
    });

    it("does NOT show 'Game result pending' if result is set", () => {
        render(<Scoreboard {...defaultProps} gameIsPast={true} />);
        expect(
            screen.queryByText("Game result pending*"),
        ).not.toBeInTheDocument();
    });
});
