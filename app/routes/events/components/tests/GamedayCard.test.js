import { render, screen, fireEvent } from "@/utils/test-utils";
import GamedayCard from "../GamedayCard";

const mockNavigate = jest.fn();
jest.mock("react-router", () => ({
    useNavigate: () => mockNavigate,
}));

// Mock CardSection
jest.mock("../CardSection", () => ({ onClick, heading, subHeading }) => (
    <div onClick={onClick} data-testid="card-section">
        <h3>{heading}</h3>
        <div>{subHeading}</div>
    </div>
));

describe("GamedayCard Component", () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    const defaultProps = {
        gameId: "game123",
        isLive: false,
        isPast: false,
        canScore: false,
    };

    it("renders Future Game (Follow The Action) by default", () => {
        render(<GamedayCard {...defaultProps} />);

        expect(screen.getByText("Gameday Hub")).toBeInTheDocument();
        expect(screen.getByText("Follow The Action")).toBeInTheDocument();
    });

    it("renders Future Game (Score the Game) if canScore is true", () => {
        render(<GamedayCard {...defaultProps} canScore={true} />);

        expect(screen.getByText("Score the Game")).toBeInTheDocument();
    });

    it("renders Live Game (Follow) if isLive is true", () => {
        render(<GamedayCard {...defaultProps} isLive={true} />);

        expect(screen.getByText("Ongoing Gameday")).toBeInTheDocument();
        expect(screen.getByText("Follow the Action")).toBeInTheDocument();
        expect(screen.getByText("LIVE NOW")).toBeInTheDocument();
    });

    it("renders Live Game (Score) if isLive and canScore are true", () => {
        render(<GamedayCard {...defaultProps} isLive={true} canScore={true} />);

        expect(screen.getByText("Score this Game")).toBeInTheDocument();
        expect(screen.getByText("LIVE NOW")).toBeInTheDocument();
    });

    it("renders Past Game (Recap) if isPast is true", () => {
        render(<GamedayCard {...defaultProps} isPast={true} />);

        expect(screen.getByText("Gameday Recap")).toBeInTheDocument();
        expect(screen.getByText("View Stats & Recap")).toBeInTheDocument();
    });

    it("navigates to gameday route on click", () => {
        render(<GamedayCard {...defaultProps} />);

        fireEvent.click(screen.getByTestId("card-section"));
        expect(mockNavigate).toHaveBeenCalledWith("/events/game123/gameday");
    });
});
