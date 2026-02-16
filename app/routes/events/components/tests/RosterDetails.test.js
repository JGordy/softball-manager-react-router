import { render, screen, fireEvent } from "@/utils/test-utils";
import * as analyticsUtils from "@/utils/analytics";

import RosterDetails from "../RosterDetails";

// Mock dependencies
jest.mock("react-router", () => ({
    Link: ({ to, children, ...props }) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
}));

jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, opened, title }) =>
            opened ? (
                <div role="dialog" aria-label={title}>
                    {children}
                </div>
            ) : null,
);

jest.mock("@/components/DeferredLoader");

jest.mock("@/components/PlayerChart", () => () => (
    <div data-testid="player-chart">Player Chart</div>
));

jest.mock("@/components/InlineError", () => ({ message }) => (
    <div data-testid="inline-error">{message}</div>
));

jest.mock("../AvailablityContainer", () => () => (
    <div data-testid="availability-container">Availability Container</div>
));

jest.mock("../CardSection", () => ({ onClick, heading, subHeading }) => (
    <div onClick={onClick} data-testid="card-section">
        <h3>{heading}</h3>
        <div>{subHeading}</div>
    </div>
));

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
        deferredData: {
            attendance: { rows: [] },
            players: [],
        },
        game: { $id: "game1" },
        managerView: false,
        playerChart: null,
        team: { $id: "team1" },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders card sections", () => {
        render(<RosterDetails {...defaultProps} />);
        expect(
            screen.getByText("Roster & Availability Details"),
        ).toBeInTheDocument();
        expect(screen.getByText("Lineup & Field Chart")).toBeInTheDocument();
        expect(screen.getByText("Player Availability")).toBeInTheDocument();
    });

    it("shows 'Charts currently not available' when no playerChart exists", () => {
        render(<RosterDetails {...defaultProps} />);
        expect(
            screen.getByText("Charts currently not available"),
        ).toBeInTheDocument();
    });

    it("shows 'Charts available to view' when playerChart exists", () => {
        render(
            <RosterDetails {...defaultProps} playerChart={{ id: "chart1" }} />,
        );
        expect(
            screen.getByText("Charts available to view"),
        ).toBeInTheDocument();
    });

    it("opens lineup drawer when clicked (no chart, non-manager)", () => {
        render(<RosterDetails {...defaultProps} />);

        // Open drawer
        fireEvent.click(screen.getByText("Lineup & Field Chart"));

        expect(
            screen.getByRole("dialog", { name: "Lineup Details" }),
        ).toBeInTheDocument();
        expect(screen.getByText("Charts not yet created")).toBeInTheDocument();
        // Use regex to match text that might be broken up by elements or whitespace
        expect(screen.getByText(/Please check back later/)).toBeInTheDocument();
        // Should NOT show Create button for non-manager
        expect(screen.queryByText("Create Charts")).not.toBeInTheDocument();
    });

    it("opens lineup drawer when clicked (no chart, manager)", () => {
        render(<RosterDetails {...defaultProps} managerView={true} />);

        fireEvent.click(screen.getByText("Lineup & Field Chart"));

        expect(
            screen.getByRole("dialog", { name: "Lineup Details" }),
        ).toBeInTheDocument();
        // Use regex to match text that might be broken up by elements or whitespace
        expect(
            screen.getByText(/As an admin, you can create them below/),
        ).toBeInTheDocument();
        expect(screen.getByText("Create Charts")).toBeInTheDocument();
    });

    it("opens lineup drawer with chart content when chart exists", () => {
        render(
            <RosterDetails {...defaultProps} playerChart={{ id: "chart1" }} />,
        );

        fireEvent.click(screen.getByText("Lineup & Field Chart"));

        expect(screen.getByTestId("player-chart")).toBeInTheDocument();
        expect(screen.getByText("Print")).toBeInTheDocument(); // Print button should be visible
    });

    it("handles print action", () => {
        render(
            <RosterDetails {...defaultProps} playerChart={{ id: "chart1" }} />,
        );

        fireEvent.click(screen.getByText("Lineup & Field Chart"));
        fireEvent.click(screen.getByText("Print"));

        expect(window.print).toHaveBeenCalled();
        expect(analyticsUtils.trackEvent).toHaveBeenCalledWith("print-lineup", {
            eventId: "game1",
        });
    });

    it("opens availability drawer when clicked", () => {
        render(<RosterDetails {...defaultProps} />);

        fireEvent.click(screen.getByText("Player Availability"));

        expect(
            screen.getByRole("dialog", { name: "Availability Details" }),
        ).toBeInTheDocument();
        expect(
            screen.getByTestId("availability-container"),
        ).toBeInTheDocument();
    });
});
