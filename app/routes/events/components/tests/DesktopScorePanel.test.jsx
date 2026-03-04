import { render, screen } from "@/utils/test-utils";
import DesktopScorePanel from "../DesktopScorePanel";

describe("DesktopScorePanel", () => {
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

    it("renders team name and opponent correctly for home game", () => {
        render(<DesktopScorePanel {...defaultProps} />);
        expect(screen.getByText("My Team")).toBeInTheDocument();
        expect(screen.getByText("Bad News Bears")).toBeInTheDocument();
    });

    it("renders Home/Away labels", () => {
        render(<DesktopScorePanel {...defaultProps} />);
        expect(screen.getByText("Home")).toBeInTheDocument();
        expect(screen.getByText("Away")).toBeInTheDocument();
    });

    it("renders scores correctly — home score on right (score-a), away on left (score-b)", () => {
        render(<DesktopScorePanel {...defaultProps} />);
        // isHomeGame=true → homeScore = score (5), awayScore = opponentScore (3)
        // score-a = home (right), score-b = away (left)
        expect(screen.getByTestId("score-a")).toHaveTextContent("5");
        expect(screen.getByTestId("score-b")).toHaveTextContent("3");
    });

    it("renders 0 scores when score is undefined", () => {
        const props = {
            ...defaultProps,
            game: {
                ...defaultProps.game,
                score: undefined,
                opponentScore: undefined,
            },
        };
        render(<DesktopScorePanel {...props} />);
        expect(screen.getByTestId("score-a")).toHaveTextContent("0");
        expect(screen.getByTestId("score-b")).toHaveTextContent("0");
    });

    it("shows Win badge for past won game", () => {
        render(<DesktopScorePanel {...defaultProps} />);
        expect(screen.getByText("Win")).toBeInTheDocument();
    });

    it("shows Loss badge for past lost game", () => {
        const props = {
            ...defaultProps,
            game: { ...defaultProps.game, result: "lost" },
        };
        render(<DesktopScorePanel {...props} />);
        expect(screen.getByText("Loss")).toBeInTheDocument();
    });

    it("shows LIVE badge when gameInProgress", () => {
        render(
            <DesktopScorePanel
                {...defaultProps}
                gameIsPast={false}
                gameInProgress={true}
            />,
        );
        expect(screen.getByText("LIVE")).toBeInTheDocument();
    });

    it("shows 'Final' status label for past games", () => {
        render(<DesktopScorePanel {...defaultProps} />);
        expect(screen.getByText("Final")).toBeInTheDocument();
    });

    it("shows 'Upcoming' status label for upcoming games", () => {
        render(
            <DesktopScorePanel
                {...defaultProps}
                gameIsPast={false}
                gameInProgress={false}
            />,
        );
        expect(screen.getByText("Upcoming")).toBeInTheDocument();
    });

    it("swaps team sides for away games — opponent becomes Home on right", () => {
        const props = {
            ...defaultProps,
            game: { ...defaultProps.game, isHomeGame: false },
        };
        render(<DesktopScorePanel {...props} />);
        // When isHomeGame=false: opponent = homeTeam (right), ourTeam = awayTeam (left)
        expect(screen.getByText("My Team")).toBeInTheDocument();
        expect(screen.getByText("Bad News Bears")).toBeInTheDocument();
    });
});
