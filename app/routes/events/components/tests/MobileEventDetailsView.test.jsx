import { render, screen } from "@/utils/test-utils";
import MobileEventDetailsView from "../MobileEventDetailsView";

jest.mock("../DetailsCard", () => () => <div data-testid="details-card" />);
jest.mock("../GamedayCard", () => () => <div data-testid="gameday-card" />);
jest.mock("../WeatherCard", () => () => <div data-testid="weather-card" />);
jest.mock("../AwardsContainer", () => () => (
    <div data-testid="awards-container" />
));
jest.mock("../RosterDetails", () => () => <div data-testid="roster-details" />);

describe("MobileEventDetailsView", () => {
    const defaultProps = {
        game: { $id: "game1", gameDate: "2026-03-08T18:30:00Z" },
        deferredData: {},
        season: {},
        team: {},
        user: { $id: "user1" },
        weatherPromise: Promise.resolve({}),
        gameInProgress: false,
        gameIsPast: false,
        isScorekeeper: false,
        managerView: false,
        playerChart: null,
    };

    it("renders DetailsCard, GamedayCard, WeatherCard, and RosterDetails for future game", () => {
        render(<MobileEventDetailsView {...defaultProps} />);

        expect(screen.getByTestId("details-card")).toBeInTheDocument();
        expect(screen.getByTestId("gameday-card")).toBeInTheDocument();
        expect(screen.getByTestId("weather-card")).toBeInTheDocument();
        expect(screen.getByTestId("roster-details")).toBeInTheDocument();
        expect(
            screen.queryByTestId("awards-container"),
        ).not.toBeInTheDocument();
    });

    it("renders AwardsContainer instead of WeatherCard for past games", () => {
        render(<MobileEventDetailsView {...defaultProps} gameIsPast={true} />);

        expect(screen.getByTestId("awards-container")).toBeInTheDocument();
        expect(screen.queryByTestId("weather-card")).not.toBeInTheDocument();
    });

    it("does NOT render gameday-card or awards-container for practice", () => {
        const practiceGame = { ...defaultProps.game, eventType: "practice" };
        render(
            <MobileEventDetailsView
                {...defaultProps}
                game={practiceGame}
                gameIsPast={true}
            />,
        );

        expect(screen.queryByTestId("gameday-card")).not.toBeInTheDocument();
        expect(
            screen.queryByTestId("awards-container"),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByTestId("achievements-container"),
        ).not.toBeInTheDocument();
    });

    it("still renders weather-card for future practice", () => {
        const practiceGame = { ...defaultProps.game, eventType: "practice" };
        render(
            <MobileEventDetailsView {...defaultProps} game={practiceGame} />,
        );

        expect(screen.getByTestId("weather-card")).toBeInTheDocument();
    });
});
