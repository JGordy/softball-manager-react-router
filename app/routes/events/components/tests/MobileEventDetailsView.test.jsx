import { render, screen, fireEvent } from "@/utils/test-utils";
import MobileEventDetailsView from "../MobileEventDetailsView";

jest.mock("../DetailsCard", () => {
    return function MockDetailsCard() {
        return <div data-testid="details-card" />;
    };
});
jest.mock("../GamedayCard", () => {
    return function MockGamedayCard() {
        return <div data-testid="gameday-card" />;
    };
});
jest.mock("../WeatherCard", () => {
    return function MockWeatherCard({ variant }) {
        return (
            <div data-testid={`weather-card-${variant}`}>
                Weather Card {variant}
            </div>
        );
    };
});
jest.mock("../RosterDetails", () => {
    return function MockRosterDetails() {
        return <div data-testid="roster-details" />;
    };
});
jest.mock("../AvailablityContainer", () => {
    return function MockAvailablityContainer() {
        return (
            <div data-testid="availability-container">
                Availability Container
            </div>
        );
    };
});

jest.mock("@/components/DeferredLoader", () => {
    return function MockDeferredLoader({ resolve, children, fallback }) {
        // If resolve is passed, immediately resolve it with mock data
        if (resolve) {
            return children({
                attendance: {
                    rows: [{ playerId: "user1", availability: "accepted" }],
                },
                players: [{ $id: "user1", firstName: "Joe" }],
            });
        }
        return fallback || null;
    };
});

jest.mock("@/components/DrawerContainer", () => {
    return function MockDrawerContainer({ children, opened, title }) {
        return opened ? (
            <div role="dialog" aria-label={title}>
                {children}
            </div>
        ) : null;
    };
});

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
        onOpenAwards: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders DetailsCard, GamedayCard, WeatherBadge, AvailabilityBadge, and RosterDetails for future game", () => {
        render(<MobileEventDetailsView {...defaultProps} />);

        expect(screen.getByTestId("details-card")).toBeInTheDocument();
        expect(screen.getByTestId("gameday-card")).toBeInTheDocument();
        expect(screen.getByTestId("weather-card-badge")).toBeInTheDocument();
        expect(
            screen.getByTestId("availability-badge-button"),
        ).toBeInTheDocument();
        expect(screen.getByTestId("roster-details")).toBeInTheDocument();
    });

    it("does NOT render WeatherBadge but renders AwardsBadge for past games", () => {
        render(<MobileEventDetailsView {...defaultProps} gameIsPast={true} />);

        expect(
            screen.queryByTestId("weather-card-badge"),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId("awards-badge-button")).toBeInTheDocument();
    });

    it("triggers onOpenAwards when AwardsBadge is clicked", () => {
        render(<MobileEventDetailsView {...defaultProps} gameIsPast={true} />);

        fireEvent.click(screen.getByTestId("awards-badge-button"));
        expect(defaultProps.onOpenAwards).toHaveBeenCalled();
    });

    it("opens AvailabilityDrawer when AvailabilityBadge is clicked", () => {
        render(<MobileEventDetailsView {...defaultProps} />);

        fireEvent.click(screen.getByTestId("availability-badge-button"));
        expect(
            screen.getByRole("dialog", { name: "Vs TBD on 3/8" }),
        ).toBeInTheDocument();
        expect(
            screen.getByTestId("availability-container"),
        ).toBeInTheDocument();
    });

    it("does NOT render gameday-card or awards-badge for practice", () => {
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
            screen.queryByTestId("awards-badge-button"),
        ).not.toBeInTheDocument();
    });
});
