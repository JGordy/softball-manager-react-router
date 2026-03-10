import { useFetcher, useOutletContext } from "react-router";
import { render, screen, fireEvent, waitFor } from "@/utils/test-utils";
import StartingPagePanel from "../StartingPagePanel";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useOutletContext: jest.fn(),
    useFetcher: jest.fn(),
}));

describe("StartingPagePanel Component", () => {
    const mockUser = {
        $id: "user-123",
        prefs: { startingPage: "/events" },
    };

    const mockFetcher = {
        submit: jest.fn(),
        data: null,
        state: "idle",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useOutletContext.mockReturnValue({ user: mockUser, isDesktop: true });
        useFetcher.mockReturnValue(mockFetcher);
    });

    it("renders with correct initial selection based on user prefs", () => {
        render(<StartingPagePanel />);

        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Events")).toBeInTheDocument();
        expect(screen.getByText("Profile")).toBeInTheDocument();

        // Check if the correct one is marked as active
        // Mantine's SegmentedControl uses radio inputs under the hood
        const eventsRadio = screen.getByLabelText("Events");
        expect(eventsRadio).toBeChecked();
        expect(screen.getByLabelText("Dashboard")).not.toBeChecked();
    });

    it("renders as card on desktop", () => {
        render(<StartingPagePanel />);
        expect(screen.getByText("App Preferences")).toBeInTheDocument();
    });

    it("renders without card wrapper on mobile", () => {
        useOutletContext.mockReturnValue({ user: mockUser, isDesktop: false });
        render(<StartingPagePanel />);
        expect(screen.queryByText("App Preferences")).not.toBeInTheDocument();
        expect(screen.getByText("Starting Page")).toBeInTheDocument();
    });

    it("calls fetcher.submit when selection changes", async () => {
        render(<StartingPagePanel />);

        const dashboardBtn = screen.getByText("Dashboard");
        fireEvent.click(dashboardBtn);

        expect(mockFetcher.submit).toHaveBeenCalledWith(
            {
                _action: "update-starting-page",
                userId: "user-123",
                startingPage: "/dashboard",
            },
            { method: "post", action: "/settings" },
        );
    });

    it("shows success message when fetcher returns success", () => {
        useFetcher.mockReturnValue({
            ...mockFetcher,
            data: { success: true },
        });

        render(<StartingPagePanel />);
        expect(screen.getByText("Preference saved!")).toBeInTheDocument();
    });
});
