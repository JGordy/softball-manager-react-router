import { useFetcher, useOutletContext } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";
import AppPreferencesPanel from "../AppPreferencesPanel";
import { useMantineColorScheme } from "@mantine/core";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useOutletContext: jest.fn(),
    useFetcher: jest.fn(),
}));

// Mock Mantine color scheme
jest.mock("@mantine/core", () => ({
    ...jest.requireActual("@mantine/core"),
    useMantineColorScheme: jest.fn(),
}));

describe("AppPreferencesPanel Component", () => {
    const mockUser = {
        $id: "user-123",
        prefs: { startingPage: "/events", themePreference: "light" },
    };

    const mockFetcher = {
        submit: jest.fn(),
        data: null,
        state: "idle",
    };

    const mockColorScheme = {
        colorScheme: "light",
        setColorScheme: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useOutletContext.mockReturnValue({ user: mockUser, isDesktop: true });
        useFetcher.mockReturnValue(mockFetcher);
        useMantineColorScheme.mockReturnValue(mockColorScheme);
    });

    it("renders with correct initial selection based on user prefs", () => {
        render(<AppPreferencesPanel />);

        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Events")).toBeInTheDocument();
        expect(screen.getByText("Profile")).toBeInTheDocument();

        // Check if the correct starting page is marked as active
        const eventsRadio = screen.getByLabelText("Events");
        expect(eventsRadio).toBeChecked();
    });

    it("renders as card on desktop", () => {
        render(<AppPreferencesPanel />);
        expect(screen.getByText("App Preferences")).toBeInTheDocument();
    });

    it("renders theme options", () => {
        render(<AppPreferencesPanel />);
        expect(screen.getByText("Theme")).toBeInTheDocument();
        expect(screen.getByLabelText("Light")).toBeInTheDocument();
        expect(screen.getByLabelText("Dark")).toBeInTheDocument();
        expect(screen.getByLabelText("Auto")).toBeInTheDocument();
    });

    it("calls setColorScheme and fetcher.submit when theme changes", () => {
        render(<AppPreferencesPanel />);

        const darkBtn = screen.getByText("Dark");
        fireEvent.click(darkBtn);

        expect(mockColorScheme.setColorScheme).toHaveBeenCalledWith("dark");
        expect(mockFetcher.submit).toHaveBeenCalledWith(
            expect.objectContaining({
                _action: "update-user-preferences",
                themePreference: "dark",
            }),
            expect.any(Object),
        );
    });

    it("calls fetcher.submit when starting page changes", async () => {
        render(<AppPreferencesPanel />);

        const dashboardBtn = screen.getByText("Dashboard");
        fireEvent.click(dashboardBtn);

        expect(mockFetcher.submit).toHaveBeenCalledWith(
            {
                _action: "update-user-preferences",
                userId: "user-123",
                startingPage: "/dashboard",
            },
            { method: "post", action: "/settings" },
        );
    });

    it("renders stats privacy options", () => {
        render(<AppPreferencesPanel />);
        expect(screen.getByText("Stats Privacy")).toBeInTheDocument();
        expect(screen.getByLabelText("Public")).toBeInTheDocument();
        expect(screen.getByLabelText("Private")).toBeInTheDocument();
    });

    it("calls fetcher.submit when stats privacy changes", () => {
        render(<AppPreferencesPanel />);
        const privateBtn = screen.getByText("Private");
        fireEvent.click(privateBtn);

        expect(mockFetcher.submit).toHaveBeenCalledWith(
            {
                _action: "update-user-preferences",
                userId: "user-123",
                statsPrivacy: "private",
            },
            { method: "post", action: "/settings" },
        );
    });

    it("renders default availability for teams", () => {
        const mockTeams = [
            { $id: "team-1", name: "Team One" },
            { $id: "team-2", name: "Team Two" },
        ];
        render(<AppPreferencesPanel teams={mockTeams} />);

        expect(screen.getByText("Default Availability")).toBeInTheDocument();
        expect(screen.getByText("Team One")).toBeInTheDocument();
        expect(screen.getByText("Team Two")).toBeInTheDocument();
    });

    it("calls fetcher.submit when default availability changes", () => {
        const mockTeams = [{ $id: "team-1", name: "Team One" }];
        render(<AppPreferencesPanel teams={mockTeams} />);

        const attendingBtns = screen.getAllByText("Attending");
        fireEvent.click(attendingBtns[0]);

        expect(mockFetcher.submit).toHaveBeenCalledWith(
            {
                _action: "update-user-preferences",
                userId: "user-123",
                defaultAvailability: JSON.stringify({ "team-1": "accepted" }),
            },
            { method: "post", action: "/settings" },
        );
    });

    it("shows success message when fetcher returns success", () => {
        useFetcher.mockReturnValue({
            ...mockFetcher,
            data: { success: true },
        });

        render(<AppPreferencesPanel />);
        expect(screen.getByText("Preference saved!")).toBeInTheDocument();
    });

    it("disables controls when fetcher is loading", () => {
        useFetcher.mockReturnValue({
            ...mockFetcher,
            state: "submitting",
        });

        render(<AppPreferencesPanel />);

        // Theme control (identified by its labels)
        const lightBtn = screen.getByLabelText("Light");
        const darkBtn = screen.getByLabelText("Dark");
        const autoBtn = screen.getByLabelText("Auto");

        expect(lightBtn).toBeDisabled();
        expect(darkBtn).toBeDisabled();
        expect(autoBtn).toBeDisabled();

        // Starting page control
        const dashboardBtn = screen.getByLabelText("Dashboard");
        expect(dashboardBtn).toBeDisabled();
    });
});
