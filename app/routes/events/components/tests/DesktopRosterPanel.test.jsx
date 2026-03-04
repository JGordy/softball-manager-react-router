import { render, screen } from "@/utils/test-utils";
import DesktopRosterPanel from "../DesktopRosterPanel";

jest.mock("@/components/DeferredLoader");

jest.mock("@/components/InlineError", () => ({ message }) => (
    <div data-testid="inline-error">{message}</div>
));

jest.mock("../AvailablityContainer", () => () => (
    <div data-testid="availability-container" />
));

jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

describe("DesktopRosterPanel", () => {
    const defaultProps = {
        deferredData: {
            attendance: {
                rows: [
                    { playerId: "p1", status: "accepted" },
                    { playerId: "p2", status: "declined" },
                ],
            },
            players: [
                { $id: "p1", firstName: "Alice", lastName: "Smith" },
                { $id: "p2", firstName: "Bob", lastName: "Jones" },
            ],
        },
        game: { $id: "game1" },
        managerView: false,
        team: {},
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the availability section header", () => {
        render(<DesktopRosterPanel {...defaultProps} />);
        expect(screen.getByText("Player Availability")).toBeInTheDocument();
    });

    it("renders count badges for available and declined players", () => {
        render(<DesktopRosterPanel {...defaultProps} />);
        expect(screen.getByText("1 in")).toBeInTheDocument();
        expect(screen.getByText("1 out")).toBeInTheDocument();
    });

    it("renders player initials in availability grid", () => {
        render(<DesktopRosterPanel {...defaultProps} />);
        expect(screen.getByText("AS")).toBeInTheDocument();
        expect(screen.getByText("BJ")).toBeInTheDocument();
    });

    it("renders the attendance RSVP section for non-manager", () => {
        render(<DesktopRosterPanel {...defaultProps} />);
        expect(screen.getByText("Your Attendance")).toBeInTheDocument();
        expect(
            screen.getByTestId("availability-container"),
        ).toBeInTheDocument();
    });

    it("renders Manage Attendance heading for manager", () => {
        render(<DesktopRosterPanel {...defaultProps} managerView={true} />);
        expect(screen.getByText("Manage Attendance")).toBeInTheDocument();
    });

    it("does NOT render any lineup section", () => {
        render(<DesktopRosterPanel {...defaultProps} />);
        expect(screen.queryByText(/Lineup/i)).not.toBeInTheDocument();
    });
});
