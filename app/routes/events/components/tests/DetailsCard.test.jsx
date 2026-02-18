import { render, screen, fireEvent } from "@/utils/test-utils";
import DetailsCard from "../DetailsCard";

// Prioritize mocking dependencies
jest.mock("@/utils/dateTime", () => ({
    formatGameTime: jest.fn(() => "Wed, Oct 10 • 7:00 PM"),
}));

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
jest.mock("@/components/DeferredLoader");

jest.mock("@/components/InlineError", () => () => (
    <div>Error loading data</div>
));

jest.mock("../ParkDetailsDrawer", () => () => (
    <div data-testid="park-details-drawer" />
));
jest.mock("../CalendarDetails", () => () => (
    <div data-testid="calendar-details-drawer" />
));

// Mock CardSection to handle click and simple rendering
jest.mock("../CardSection", () => ({ onClick, heading, subHeading }) => (
    <div onClick={onClick} data-testid="card-section">
        <div data-testid="section-heading">{heading}</div>
        {subHeading && <div data-testid="section-subheading">{subHeading}</div>}
    </div>
));

describe("DetailsCard Component", () => {
    const defaultProps = {
        game: {
            gameDate: "2023-10-10T19:00:00Z",
            timeZone: "UTC",
            location: "Field 1",
            locationNotes: "Bring water",
        },
        deferredData: {
            park: {
                googleMapsURI: "http://maps.google.com",
                formattedAddress: "123 Park Ln",
                name: "Central Park",
            },
        }, // Passed to DeferredLoader
        season: { location: "Default Field" },
        team: { name: "Team A" },
    };

    it("renders game time and location", () => {
        render(<DetailsCard {...defaultProps} />);

        expect(screen.getByText("Wed, Oct 10 • 7:00 PM")).toBeInTheDocument();
        expect(screen.getByText("123 Park Ln")).toBeInTheDocument();
        expect(screen.getByText("Bring water")).toBeInTheDocument();
    });

    it("opens Calendar drawer when time section is clicked", () => {
        render(<DetailsCard {...defaultProps} />);

        // Find section with time heading
        const sections = screen.getAllByTestId("card-section");
        const timeSection = sections[0]; // First one is time

        fireEvent.click(timeSection);

        expect(
            screen.getByRole("dialog", { name: "Add Game to Calendar" }),
        ).toBeInTheDocument();
        expect(
            screen.getByTestId("calendar-details-drawer"),
        ).toBeInTheDocument();
    });

    it("opens Location drawer when location section is clicked", () => {
        render(<DetailsCard {...defaultProps} />);

        // Find section with location heading
        const sections = screen.getAllByTestId("card-section");
        const locationSection = sections[1]; // Second one is location

        fireEvent.click(locationSection);

        expect(
            screen.getByRole("dialog", { name: "Location Details" }),
        ).toBeInTheDocument();
        expect(screen.getByTestId("park-details-drawer")).toBeInTheDocument();
    });
});
