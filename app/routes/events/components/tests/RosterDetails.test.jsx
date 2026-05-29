import { render, screen, fireEvent } from "@/utils/test-utils";
import * as analyticsUtils from "@/utils/analytics";

import RosterDetails from "../RosterDetails";

// Mock dependencies
jest.mock("react-router", () => ({
    Link: function MockLink({ to, children, ...props }) {
        return (
            <a href={to} {...props}>
                {children}
            </a>
        );
    },
}));

jest.mock("@/components/DrawerContainer", () => {
    return function MockDrawerContainer({ children, opened, title }) {
        return opened ? (
            <div role="dialog" aria-label={title}>
                {children}
            </div>
        ) : null;
    };
});

jest.mock("@/components/PlayerChart", () => {
    return function MockPlayerChart() {
        return <div data-testid="player-chart">Player Chart</div>;
    };
});

jest.mock("../FieldLineupPreview", () => {
    return function MockFieldLineupPreview() {
        return (
            <div data-testid="field-lineup-preview">Field Lineup Preview</div>
        );
    };
});

jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

// Mock window.print
const originalPrint = window.print;
beforeAll(() => {
    window.print = jest.fn();
});

afterAll(() => {
    window.print = originalPrint;
});

describe("RosterDetails Component", () => {
    const defaultProps = {
        game: {
            $id: "game1",
            opponent: "The Eagles",
            gameDate: "2099-06-01T18:00:00Z",
            timeZone: "UTC",
        },
        managerView: false,
        playerChart: null,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders card headers", () => {
        render(<RosterDetails {...defaultProps} />);
        expect(screen.getByText("Lineup & Field Chart")).toBeInTheDocument();
    });

    it("shows 'No Lineup Set Yet' when no playerChart exists", () => {
        render(<RosterDetails {...defaultProps} />);
        expect(screen.getByText("No Lineup Set Yet")).toBeInTheDocument();
        expect(
            screen.getByText(
                "The manager hasn't posted the lineup yet. Check back closer to game time!",
            ),
        ).toBeInTheDocument();
    });

    it("renders FieldLineupPreview by default when playerChart exists, and toggles to PlayerChart when selected", () => {
        render(
            <RosterDetails
                {...defaultProps}
                playerChart={[{ firstName: "Joe", positions: ["Third Base"] }]}
            />,
        );

        // Should have segmented control
        expect(
            screen.getByTestId("lineup-view-segmented-control"),
        ).toBeInTheDocument();

        // Should display field view by default
        expect(screen.getByTestId("field-lineup-preview")).toBeInTheDocument();
        expect(
            screen.queryByTestId("card-player-chart-container"),
        ).not.toBeInTheDocument();

        // Find buttons in the segmented control (or simulate change)
        const control = screen.getByTestId("lineup-view-segmented-control");

        // Let's click the Lineup View option (mock SegmentedControl will have buttons or labels we can find)
        const lineupButton = screen.getByText("Lineup View");
        fireEvent.click(lineupButton);

        // Now should display the PlayerChart in the card, and not the Field preview
        expect(
            screen.getByTestId("card-player-chart-container"),
        ).toBeInTheDocument();
        expect(
            screen.queryByTestId("field-lineup-preview"),
        ).not.toBeInTheDocument();
    });

    it("opens lineup drawer when wrapper clicked (no chart, non-manager)", () => {
        render(<RosterDetails {...defaultProps} />);

        // Click the card wrapper
        fireEvent.click(screen.getByTestId("lineup-field-chart-card-wrapper"));

        expect(
            screen.getByRole("dialog", { name: "Lineup Details" }),
        ).toBeInTheDocument();
        expect(screen.getByText("Charts not yet created")).toBeInTheDocument();
        expect(screen.getByText(/Please check back later/)).toBeInTheDocument();
        // Should NOT show Create button for non-manager
        expect(screen.queryByText("Create Charts")).not.toBeInTheDocument();
    });

    it("opens lineup drawer when wrapper clicked (no chart, manager)", () => {
        render(<RosterDetails {...defaultProps} managerView={true} />);

        fireEvent.click(screen.getByTestId("lineup-field-chart-card-wrapper"));

        expect(
            screen.getByRole("dialog", { name: "Lineup Details" }),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/As an admin, you can create them below/),
        ).toBeInTheDocument();
        expect(screen.getByText("Create Charts")).toBeInTheDocument();
    });

    it("opens lineup drawer with chart content when chart exists", () => {
        render(
            <RosterDetails
                {...defaultProps}
                playerChart={[{ firstName: "Joe", positions: ["Third Base"] }]}
            />,
        );

        fireEvent.click(screen.getByTestId("lineup-field-chart-card-wrapper"));

        expect(screen.getByTestId("player-chart")).toBeInTheDocument();
        expect(screen.getByText("Print")).toBeInTheDocument(); // Print button should be visible
    });

    it("handles print action", () => {
        render(
            <RosterDetails
                {...defaultProps}
                playerChart={[{ firstName: "Joe", positions: ["Third Base"] }]}
            />,
        );

        fireEvent.click(screen.getByTestId("lineup-field-chart-card-wrapper"));
        fireEvent.click(screen.getByText("Print"));

        expect(window.print).toHaveBeenCalled();
        expect(analyticsUtils.trackEvent).toHaveBeenCalledWith("print-lineup", {
            eventId: "game1",
        });
    });

    it("does NOT render anything for practice", () => {
        const practiceProps = {
            ...defaultProps,
            game: { ...defaultProps.game, eventType: "practice" },
        };
        render(<RosterDetails {...practiceProps} />);

        expect(
            screen.queryByText("Lineup & Field Chart"),
        ).not.toBeInTheDocument();
        expect(screen.queryByTestId("roster-details")).not.toBeInTheDocument();
    });
});
