import { useClipboard } from "@mantine/hooks";

import { render, screen, fireEvent } from "@/utils/test-utils";

import ParkDetailsDrawer from "../ParkDetailsDrawer";

// Mock mantine hooks
jest.mock("@mantine/hooks", () => ({
    ...jest.requireActual("@mantine/hooks"),
    useClipboard: jest.fn(),
    useIsomorphicEffect: jest.requireActual("react").useEffect,
}));

// Mock icons
jest.mock("@tabler/icons-react", () => ({
    IconMapPin: () => <div data-testid="icon-map-pin" />,
    IconLocationFilled: () => <div data-testid="icon-location-filled" />,
    IconCopy: () => <div data-testid="icon-copy" />,
}));

// Mock analytics
jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

describe("ParkDetailsDrawer", () => {
    const mockPark = {
        $id: "park1",
        displayName: "Central Park",
        formattedAddress: "123 Park Ave, NY",
        googleMapsURI: "http://maps.google.com/?q=Central+Park",
    };

    const mockCopy = jest.fn();

    beforeEach(() => {
        useClipboard.mockReturnValue({
            copy: mockCopy,
            copied: false,
        });
        jest.clearAllMocks();
    });

    const renderComponent = () => {
        return render(<ParkDetailsDrawer park={mockPark} />);
    };

    it("renders park details", () => {
        renderComponent();
        expect(screen.getByText("Central Park")).toBeInTheDocument();
        expect(screen.getByText("123 Park Ave, NY")).toBeInTheDocument();
    });

    it("renders Google Maps link", () => {
        renderComponent();
        const link = screen.getByText("View on Google Maps").closest("a");
        expect(link).toHaveAttribute("href", mockPark.googleMapsURI);
    });

    it("handles copy address button click", () => {
        renderComponent();

        const copyButton = screen.getByText("Copy Address");
        fireEvent.click(copyButton);

        expect(mockCopy).toHaveBeenCalledWith(mockPark.formattedAddress);
    });

    it("shows 'Copied!' feedback", () => {
        useClipboard.mockReturnValue({
            copy: mockCopy,
            copied: true,
        });
        renderComponent();

        expect(screen.getByText("Copied!")).toBeInTheDocument();
        expect(screen.queryByText("Copy Address")).not.toBeInTheDocument();
    });
});
