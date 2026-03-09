import { useComputedColorScheme } from "@mantine/core";
import { render, screen, fireEvent } from "@/utils/test-utils";
import EventsFilter from "../EventsFilter";

jest.mock("@mantine/core", () => {
    const actual = jest.requireActual("@mantine/core");
    return {
        ...actual,
        useComputedColorScheme: jest.fn(),
    };
});

describe("EventsFilter Component", () => {
    const mockTeamsData = [
        { $id: "team1", name: "Team 1" },
        { $id: "team2", name: "Team 2" },
    ];

    const defaultProps = {
        teamsData: mockTeamsData,
        filterId: "all",
        onFilterChange: jest.fn(),
        showFilters: true,
        onToggleFilters: jest.fn(),
        onCloseFilters: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useComputedColorScheme.mockReturnValue("light");
    });

    it("renders filter menu trigger", () => {
        render(<EventsFilter {...defaultProps} showFilters={false} />);
        expect(screen.getByLabelText("Filter Games")).toBeInTheDocument();
    });

    it("calls onToggleFilters when trigger is clicked", () => {
        render(<EventsFilter {...defaultProps} showFilters={false} />);
        fireEvent.click(screen.getByLabelText("Filter Games"));
        expect(defaultProps.onToggleFilters).toHaveBeenCalled();
    });

    it("renders segments when menu is open", () => {
        render(<EventsFilter {...defaultProps} />);
        expect(screen.getByText("Filter Games by Team")).toBeInTheDocument();
        expect(screen.getByText("Team 1")).toBeInTheDocument();
        expect(screen.getByText("Team 2")).toBeInTheDocument();
    });

    it("calls onFilterChange when a different team is selected", () => {
        render(<EventsFilter {...defaultProps} />);
        fireEvent.click(screen.getByLabelText("Team 1"));
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith("team1");
    });

    it("returns null if teamsData has 1 or fewer teams", () => {
        render(
            <EventsFilter
                {...defaultProps}
                teamsData={[{ $id: "1", name: "T1" }]}
            />,
        );
        expect(screen.queryByLabelText("Filter Games")).not.toBeInTheDocument();
    });
});
