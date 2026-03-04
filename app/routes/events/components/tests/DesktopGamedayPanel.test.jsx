import { render, screen, fireEvent } from "@/utils/test-utils";
import DesktopGamedayPanel from "../DesktopGamedayPanel";

jest.mock("react-router", () => ({
    useNavigate: jest.fn(),
}));

jest.mock("@/components/DeferredLoader");
jest.mock("@/components/InlineError", () => ({ message }) => (
    <div data-testid="inline-error">{message}</div>
));

jest.mock("../../utils/getGameDateWeather", () => jest.fn());
jest.mock("../../utils/getPrecipitationRating", () =>
    jest.fn(() => ({ color: "lime" })),
);
jest.mock("../../utils/getWindSpeedRating", () =>
    jest.fn(() => ({ color: "blue" })),
);

describe("DesktopGamedayPanel", () => {
    const mockNavigate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        require("react-router").useNavigate.mockReturnValue(mockNavigate);
    });

    const defaultProps = {
        gameId: "game1",
        gameInProgress: false,
        gameIsPast: false,
        canScore: false,
        weatherPromise: Promise.resolve({}),
        gameDate: "2026-03-08T18:30:00Z",
    };

    it("renders 'Gameday Hub' title for upcoming games", () => {
        render(<DesktopGamedayPanel {...defaultProps} />);
        expect(screen.getByText("Gameday Hub")).toBeInTheDocument();
    });

    it("renders 'Ongoing Gameday' title when game is in progress", () => {
        render(<DesktopGamedayPanel {...defaultProps} gameInProgress={true} />);
        expect(screen.getByText("Ongoing Gameday")).toBeInTheDocument();
    });

    it("renders 'Gameday Recap' title for past games", () => {
        render(<DesktopGamedayPanel {...defaultProps} gameIsPast={true} />);
        expect(screen.getByText("Gameday Recap")).toBeInTheDocument();
    });

    it("renders 'Follow The Action' for upcoming non-scorer", () => {
        render(<DesktopGamedayPanel {...defaultProps} />);
        expect(screen.getByText("Follow The Action")).toBeInTheDocument();
    });

    it("renders 'Score the Game' for upcoming scorer", () => {
        render(<DesktopGamedayPanel {...defaultProps} canScore={true} />);
        expect(screen.getByText("Score the Game")).toBeInTheDocument();
    });

    it("renders 'View Stats & Recap' for past games", () => {
        render(<DesktopGamedayPanel {...defaultProps} gameIsPast={true} />);
        expect(screen.getByText("View Stats & Recap")).toBeInTheDocument();
    });

    it("shows LIVE NOW badge when game is in progress", () => {
        render(<DesktopGamedayPanel {...defaultProps} gameInProgress={true} />);
        expect(screen.getByText("LIVE NOW")).toBeInTheDocument();
    });

    it("navigates to /gameday when Follow button is clicked", () => {
        render(<DesktopGamedayPanel {...defaultProps} />);
        fireEvent.click(screen.getByText("Follow"));
        expect(mockNavigate).toHaveBeenCalledWith("/events/game1/gameday");
    });

    it("does NOT render weather strip for past games", () => {
        render(<DesktopGamedayPanel {...defaultProps} gameIsPast={true} />);
        expect(screen.queryByText("Gameday Forecast")).not.toBeInTheDocument();
    });

    it("renders weather forecast section for upcoming games", () => {
        render(<DesktopGamedayPanel {...defaultProps} />);
        expect(screen.getByText("Gameday Forecast")).toBeInTheDocument();
    });

    it("renders only the forecast card when weatherOnly=true", () => {
        render(<DesktopGamedayPanel {...defaultProps} weatherOnly={true} />);
        expect(screen.getByText("Gameday Forecast")).toBeInTheDocument();
        expect(screen.queryByText("Gameday Hub")).not.toBeInTheDocument();
    });

    it("renders nothing when weatherOnly=true and gameIsPast=true", () => {
        const { queryByText } = render(
            <DesktopGamedayPanel
                {...defaultProps}
                weatherOnly={true}
                gameIsPast={true}
            />,
        );
        // Component returns null — neither hub tile nor weather card should appear
        expect(queryByText("Gameday Forecast")).not.toBeInTheDocument();
        expect(queryByText("Gameday Recap")).not.toBeInTheDocument();
    });
});
