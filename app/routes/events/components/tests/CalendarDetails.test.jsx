import { google, ics, outlook, office365 } from "calendar-link";
import { useOs } from "@mantine/hooks";

import { render, screen } from "@/utils/test-utils";

import CalendarDetails from "../CalendarDetails";

// Mock mantine hooks
jest.mock("@mantine/hooks", () => ({
    ...jest.requireActual("@mantine/hooks"),
    useOs: jest.fn(),
    useClipboard: jest.fn(),
    useIsomorphicEffect: jest.requireActual("react").useEffect,
    useDisclosure: jest.fn(() => [
        false,
        { open: jest.fn(), close: jest.fn() },
    ]),
    useMediaQuery: jest.fn(),
}));

// Mock calendar-link
jest.mock("calendar-link", () => ({
    google: jest.fn(),
    ics: jest.fn(),
    outlook: jest.fn(),
    office365: jest.fn(),
}));

// Mock icons
jest.mock("@tabler/icons-react", () => ({
    IconBrandApple: () => <div data-testid="icon-apple" />,
    IconBrandGoogleFilled: () => <div data-testid="icon-google" />,
    IconBrandOffice: () => <div data-testid="icon-office" />,
    IconBrandWindowsFilled: () => <div data-testid="icon-windows" />,
    IconCalendarPlus: () => <div data-testid="icon-calendar-plus" />,
}));

// Mock analytics
jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

describe("CalendarDetails", () => {
    const mockGame = {
        $id: "game1",
        gameDate: "2024-06-01T18:00:00Z",
        timeZone: "America/New_York",
        isHomeGame: true,
        opponent: "Opponent Team",
        location: "Test Park",
    };
    const mockPark = {
        formattedAddress: "123 Main St, City, ST",
    };
    const mockTeam = {
        name: "My Team",
    };

    beforeEach(() => {
        useOs.mockReturnValue("macos");
        google.mockReturnValue(
            "https://google.com/calendar/render?action=TEMPLATE&text=My+Team+vs+Opponent+Team",
        );
        ics.mockReturnValue("data:text/calendar;charset=utf8,BEGIN:VCALENDAR");
        outlook.mockReturnValue(
            "https://outlook.live.com/owa/?path=/calendar/action/compose&subject=My+Team+vs+Opponent+Team",
        );
        office365.mockReturnValue(
            "https://outlook.office.com/owa/?path=/calendar/action/compose&subject=My+Team+vs+Opponent+Team",
        );
        jest.clearAllMocks();
    });

    const renderComponent = (props = {}) => {
        return render(
            <CalendarDetails
                game={mockGame}
                park={mockPark}
                team={mockTeam}
                {...props}
            />,
        );
    };

    it("renders game details correctly", () => {
        renderComponent();

        expect(screen.getByText("Apple")).toBeInTheDocument();
        expect(screen.getByText("Google")).toBeInTheDocument();
        expect(screen.getByText("Outlook")).toBeInTheDocument();
        expect(screen.getByText("Office")).toBeInTheDocument();
    });

    it("prioritizes Apple calendar on macOS", () => {
        useOs.mockReturnValue("macos");
        renderComponent();

        // First button should be Apple (primary action)
        const primaryButton = screen.getAllByRole("link")[0];
        expect(primaryButton).toHaveTextContent("Apple");
    });

    it("prioritizes Google calendar on Android", () => {
        useOs.mockReturnValue("android");
        renderComponent();

        // First button should be Google
        const primaryButton = screen.getAllByRole("link")[0];
        expect(primaryButton).toHaveTextContent("Google");
    });

    const providers = [
        {
            name: "Google",
            mock: google,
            label: "Google",
            expectedHref:
                "https://google.com/calendar/render?action=TEMPLATE&text=My+Team+vs+Opponent+Team",
        },
        {
            name: "Apple",
            mock: ics,
            label: "Apple",
            expectedHref: "data:text/calendar;charset=utf8,BEGIN:VCALENDAR",
        },
        {
            name: "Outlook",
            mock: outlook,
            label: "Outlook",
            expectedHref:
                "https://outlook.live.com/owa/?path=/calendar/action/compose&subject=My+Team+vs+Opponent+Team",
        },
        {
            name: "Office 365",
            mock: office365,
            label: "Office",
            expectedHref:
                "https://outlook.office.com/owa/?path=/calendar/action/compose&subject=My+Team+vs+Opponent+Team",
        },
    ];

    providers.forEach(({ name, mock, label, expectedHref }) => {
        it(`generates correct ${name} calendar link`, () => {
            renderComponent();

            const expectedEvent = expect.objectContaining({
                title: "My Team vs Opponent Team",
                location: "123 Main St, City, ST",
                start: "2024-06-01T18:00:00Z",
            });

            // Verify provider function was called with correct event details
            expect(mock).toHaveBeenCalledWith(expectedEvent);

            // Verify the link is correctly applied to the button
            const button = screen.getByText(label).closest("a");
            expect(button).toHaveAttribute("href", expectedHref);
        });
    });
});
