import { render, screen, fireEvent } from "@/utils/test-utils";
import DesktopInfoPanel from "../DesktopInfoPanel";

jest.mock("@/utils/dateTime", () => ({
    formatGameTime: jest.fn(() => "Sun, Mar 8 • 1:30 PM"),
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

jest.mock("@/components/InlineError", () => ({ message }) => (
    <div data-testid="inline-error">{message}</div>
));

jest.mock("../CalendarDetails", () => () => (
    <div data-testid="calendar-details" />
));
jest.mock("../ParkDetailsDrawer", () => () => (
    <div data-testid="park-details-drawer" />
));
jest.mock("../AwardsDrawerContents", () => () => (
    <div data-testid="awards-drawer-contents" />
));

describe("DesktopInfoPanel", () => {
    const defaultProps = {
        game: {
            $id: "game1",
            gameDate: "2026-03-08T18:30:00Z",
            timeZone: "America/New_York",
            location: "Coan Park",
            locationNotes: "Gate B entrance",
        },
        deferredData: {
            park: {
                googleMapsURI: "https://maps.google.com",
                formattedAddress: "1530 Woodbine Ave SE, Atlanta, GA",
                displayName: "Coan Park",
            },
        },
        season: { location: "Default Field" },
        team: { name: "My Team" },
        gameIsPast: false,
        user: { $id: "user1" },
    };

    it("renders the formatted game time", () => {
        render(<DesktopInfoPanel {...defaultProps} />);
        expect(screen.getByText("Sun, Mar 8 • 1:30 PM")).toBeInTheDocument();
    });

    it("renders location name", () => {
        render(<DesktopInfoPanel {...defaultProps} />);
        expect(screen.getByText("Coan Park")).toBeInTheDocument();
    });

    it("renders the formatted park address", () => {
        render(<DesktopInfoPanel {...defaultProps} />);
        expect(
            screen.getByText("1530 Woodbine Ave SE, Atlanta, GA"),
        ).toBeInTheDocument();
    });

    it("renders location notes", () => {
        render(<DesktopInfoPanel {...defaultProps} />);
        expect(screen.getByText("Gate B entrance")).toBeInTheDocument();
    });

    it("opens the calendar drawer when Add to Calendar is clicked", () => {
        render(<DesktopInfoPanel {...defaultProps} />);
        fireEvent.click(screen.getByText("Add to Calendar"));
        expect(
            screen.getByRole("dialog", { name: "Add Game to Calendar" }),
        ).toBeInTheDocument();
        expect(screen.getByTestId("calendar-details")).toBeInTheDocument();
    });

    it("does NOT show awards section for upcoming games", () => {
        render(<DesktopInfoPanel {...defaultProps} gameIsPast={false} />);
        expect(
            screen.queryByText("Awards & Recognition"),
        ).not.toBeInTheDocument();
    });

    it("shows awards section for past games", () => {
        render(<DesktopInfoPanel {...defaultProps} gameIsPast={true} />);
        expect(screen.getByText("Awards & Recognition")).toBeInTheDocument();
    });

    it("opens awards drawer when View is clicked (past game)", () => {
        render(<DesktopInfoPanel {...defaultProps} gameIsPast={true} />);
        fireEvent.click(screen.getByText("View"));
        expect(
            screen.getByRole("dialog", { name: "Awards & Recognition" }),
        ).toBeInTheDocument();
        expect(
            screen.getByTestId("awards-drawer-contents"),
        ).toBeInTheDocument();
    });
});
