import { render, screen } from "@/utils/test-utils";
import DesktopEvents from "../DesktopEvents";

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

describe("DesktopEvents Component", () => {
    const defaultProps = {
        teamsData: [],
        filterId: "all",
        onFilterChange: jest.fn(),
        showFilters: false,
        onToggleFilters: jest.fn(),
        onCloseFilters: jest.fn(),
        filteredFutureGames: [],
        filteredPastGames: [],
    };

    it("renders both upcoming and past games in two columns", () => {
        const props = {
            ...defaultProps,
            filteredFutureGames: [{ id: "g1", name: "Upcoming Game" }],
            filteredPastGames: [{ id: "g2", name: "Past Game" }],
        };

        render(<DesktopEvents {...props} />);

        expect(screen.getByText("Upcoming Games")).toBeInTheDocument();
        expect(screen.getByText("Upcoming Game")).toBeInTheDocument();
        expect(screen.getByText("Past Games")).toBeInTheDocument();
        expect(screen.getByText("Past Game")).toBeInTheDocument();
        expect(screen.getByTestId("events-filter")).toBeInTheDocument();
    });
});
