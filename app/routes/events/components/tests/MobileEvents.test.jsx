import { render, screen } from "@/utils/test-utils";
import MobileEvents from "../MobileEvents";

jest.mock("@/components/UserHeader", () => ({ children, subText }) => (
    <div data-testid="user-header">
        <span>{subText}</span>
        {children}
    </div>
));

jest.mock("@/components/GamesList", () => ({ games }) => (
    <div data-testid="games-list">
        {games?.map((g) => (
            <div key={g.id}>{g.name}</div>
        ))}
    </div>
));

jest.mock("../EventsFilter", () => () => <div data-testid="events-filter" />);

describe("MobileEvents Component", () => {
    const defaultProps = {
        teamsData: [],
        filterId: "all",
        onFilterChange: jest.fn(),
        showFilters: false,
        onToggleFilters: jest.fn(),
        onCloseFilters: jest.fn(),
        filteredFutureGames: [],
        filteredPastGames: [],
        hasFutureGames: false,
    };

    it("renders games and tabs", () => {
        const props = {
            ...defaultProps,
            filteredFutureGames: [{ id: "g1", name: "Upcoming Game" }],
            hasFutureGames: true,
        };

        render(<MobileEvents {...props} />);
        expect(screen.getByText("Upcoming Game")).toBeInTheDocument();
        expect(screen.getByText("Upcoming")).toBeInTheDocument();
        expect(screen.getByTestId("events-filter")).toBeInTheDocument();
    });

    it("renders past games if no future games", () => {
        const props = {
            ...defaultProps,
            filteredPastGames: [{ id: "g2", name: "Past Game" }],
            hasFutureGames: false,
        };

        render(<MobileEvents {...props} />);
        expect(screen.getByText("Past Game")).toBeInTheDocument();
        expect(screen.getByText("Past")).toBeInTheDocument();
    });
});
