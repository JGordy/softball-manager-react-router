import { render, screen, fireEvent } from "@/utils/test-utils";

import AwardsDrawerContents from "../AwardsDrawerContents";

// Mock Mantine Carousel
jest.mock("@mantine/carousel", () => ({
    Carousel: ({ children, onSlideChange }) => (
        <div data-testid="carousel">
            <button onClick={() => onSlideChange(0)}>Slide 0</button>
            <button onClick={() => onSlideChange(1)}>Slide 1</button>
            {children}
        </div>
    ),
}));
// Fix for Carousel.Slide which is a property of Carousel
const CarouselMock = require("@mantine/carousel");
CarouselMock.Carousel.Slide = ({ children }) => (
    <div data-testid="carousel-slide">{children}</div>
);

// Mock child components
jest.mock("../VotesContainer", () => ({ activeAward }) => (
    <div data-testid="votes-container" data-active-award={activeAward}>
        VotesContainer
    </div>
));
jest.mock("../WinnerDisplay", () => ({ activeAward }) => (
    <div data-testid="winner-display" data-active-award={activeAward}>
        WinnerDisplay
    </div>
));

describe("AwardsDrawerContents", () => {
    const mockUser = { $id: "user1" };
    const mockGame = { $id: "game1" };
    const mockTeam = { $id: "team1" };
    const mockPlayers = [{ $id: "user1" }];
    const mockAttendance = { rows: [] };
    const mockVotes = { rows: [] };

    const defaultProps = {
        attendance: mockAttendance,
        game: mockGame,
        team: mockTeam,
        players: mockPlayers,
        user: mockUser,
        votes: mockVotes,
    };

    const renderComponent = (props = {}) => {
        return render(<AwardsDrawerContents {...defaultProps} {...props} />);
    };

    it("renders carousel with awards", () => {
        renderComponent({ awards: { total: 0, rows: [] } });

        expect(screen.getByTestId("carousel")).toBeInTheDocument();
        // The real awards map has 7 entries
        expect(screen.getAllByTestId("carousel-slide")).toHaveLength(7);

        const descriptions = screen.getAllByText(
            "The one who brings it all together with outstanding performance and team leadership.",
        );
        expect(descriptions.length).toBeGreaterThan(0);
    });

    it("shows VotesContainer when awards.total is 0 (voting active)", () => {
        renderComponent({ awards: { total: 0, rows: [] } });

        expect(screen.getByTestId("votes-container")).toBeInTheDocument();
        expect(screen.queryByTestId("winner-display")).not.toBeInTheDocument();
    });

    it("shows WinnerDisplay when awards.total > 0 (voting concluded)", () => {
        renderComponent({ awards: { total: 1, rows: [] } });

        expect(screen.getByTestId("winner-display")).toBeInTheDocument();
        expect(screen.queryByTestId("votes-container")).not.toBeInTheDocument();
    });

    it("updates active award when carousel slide changes", async () => {
        renderComponent({ awards: { total: 0, rows: [] } });

        // Initial state: activeAward = 'mvp' (first key in actual constant)
        const votesContainer = screen.getByTestId("votes-container");
        expect(votesContainer).toHaveAttribute("data-active-award", "mvp");

        // Change slide to index 1 ('clutch' is the second key in actual constant)
        const slide1Button = screen.getByText("Slide 1");
        fireEvent.click(slide1Button);

        // Verify prop update
        expect(votesContainer).toHaveAttribute("data-active-award", "clutch");
    });
});
