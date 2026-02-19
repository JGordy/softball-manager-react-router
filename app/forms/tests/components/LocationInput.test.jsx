import { render, screen, waitFor, fireEvent, act } from "@/utils/test-utils";
import { useLoadScript } from "@react-google-maps/api";

import LocationInput from "../../components/LocationInput";

jest.mock("@react-google-maps/api", () => ({
    useLoadScript: jest.fn(),
}));

describe("LocationInput", () => {
    const mockSearchByText = jest.fn();

    beforeEach(() => {
        useLoadScript.mockReturnValue({ isLoaded: true, loadError: null });

        // Mock window.google.maps.places
        window.google = {
            maps: {
                places: {
                    Place: {
                        searchByText: mockSearchByText,
                    },
                },
            },
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete window.google;
    });

    it("renders with default props", () => {
        render(<LocationInput />);
        expect(
            screen.getByRole("textbox", { name: /location/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(/Where will the games be played?/i),
        ).toBeInTheDocument();
    });

    it("shows loading state and results when typing", async () => {
        const mockPlaces = [
            {
                displayName: "Central Park",
                formattedAddress: "New York, NY",
                location: { lat: 40.785091, lng: -73.968285 },
                id: "123",
                types: ["park"],
                googleMapsURI: "http://maps.google.com/?q=Central+Park",
            },
        ];

        mockSearchByText.mockResolvedValue({ places: mockPlaces });

        render(<LocationInput />);

        const input = screen.getByRole("textbox", { name: /location/i });

        // Simulate user typing
        await act(async () => {
            fireEvent.change(input, { target: { value: "Central" } });
        });

        // Expect search to be called
        await waitFor(() => {
            expect(mockSearchByText).toHaveBeenCalledWith(
                expect.objectContaining({
                    textQuery: "Central",
                }),
            );
        });

        // Check if options are displayed
        // Mantine Autocomplete might render options in a portal or require focus
        // We trigger it via typing, so it should be there.
        // It renders the displayName.
        await waitFor(() => {
            expect(screen.getByText("Central Park")).toBeInTheDocument();
        });
    });

    it("handles empty results", async () => {
        mockSearchByText.mockResolvedValue({ places: [] });
        const consoleSpy = jest
            .spyOn(console, "log")
            .mockImplementation(() => {});

        render(<LocationInput />);

        const input = screen.getByRole("textbox", { name: /location/i });

        await act(async () => {
            fireEvent.change(input, { target: { value: "Unknown Place" } });
        });

        await waitFor(() => {
            expect(mockSearchByText).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                "No places found for:",
                "Unknown Place",
            );
        });

        consoleSpy.mockRestore();
    });

    it("sets options to empty if not loaded", () => {
        useLoadScript.mockReturnValue({ isLoaded: false, loadError: null });
        render(<LocationInput />);
        expect(screen.getByText(/Loading Google Maps.../i)).toBeInTheDocument();
    });
});
