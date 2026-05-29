import { render, screen } from "@/utils/test-utils";
import EventCalendarDrawer from "../EventCalendarDrawer";

// Mock DrawerContainer
jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, opened, title }) =>
            opened ? (
                <div role="dialog" aria-label={title}>
                    <h2>{title}</h2>
                    {children}
                </div>
            ) : null,
);

// Mock DeferredLoader
jest.mock("@/components/DeferredLoader", () => ({ children, resolve }) => {
    const data = resolve || {};
    return typeof children === "function" ? children(data) : children;
});

// Mock CalendarDetails
jest.mock("../CalendarDetails", () => () => (
    <div data-testid="mock-calendar-details" />
));

describe("EventCalendarDrawer Component", () => {
    const defaultProps = {
        opened: true,
        onClose: jest.fn(),
        game: {
            gameDate: "2023-10-10T19:00:00Z",
            timeZone: "UTC",
        },
        deferredData: {
            park: { name: "Central Park" },
        },
        team: { name: "Team A" },
    };

    it("renders calendar details inside DrawerContainer when opened", () => {
        render(<EventCalendarDrawer {...defaultProps} />);

        expect(
            screen.getByRole("dialog", { name: "Add Game to Calendar" }),
        ).toBeInTheDocument();
        expect(screen.getByTestId("mock-calendar-details")).toBeInTheDocument();
    });
});
