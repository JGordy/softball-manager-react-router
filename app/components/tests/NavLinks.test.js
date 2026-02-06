import { useNavigate, useLocation } from "react-router";
import { screen, fireEvent, cleanup } from "@testing-library/react";
import { render } from "@/utils/test-utils";

import NavLinks from "../NavLinks";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigate: jest.fn(),
    useLocation: jest.fn(),
}));

describe("NavLinks Component", () => {
    const mockNavigate = jest.fn();

    beforeEach(() => {
        useNavigate.mockReturnValue(mockNavigate);
    });

    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it("sets active tab to 'dashboard' by default", () => {
        useLocation.mockReturnValue({ pathname: "/" });
        render(<NavLinks user={{}} />);
        expect(screen.getByText("Home")).toBeInTheDocument();
    });

    it("initializes active tab based on URL (user profile)", () => {
        useLocation.mockReturnValue({ pathname: "/user/profile" });
        render(<NavLinks user={{}} />);
        expect(screen.getByText("Profile")).toBeInTheDocument();
    });

    it("navigates to Dashboard when Dashboard tab is clicked", () => {
        useLocation.mockReturnValue({ pathname: "/user" }); // Start elsewhere
        const { container } = render(<NavLinks user={{}} />);

        // Find by value because text is hidden when inactive
        const dashboardInput = container.querySelector(
            'input[value="dashboard"]',
        );
        fireEvent.click(dashboardInput);

        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("navigates to Settings when Settings tab is clicked", () => {
        useLocation.mockReturnValue({ pathname: "/" });
        const { container } = render(<NavLinks user={{}} />);

        // Find by value because text is hidden when inactive
        const settingsInput = container.querySelector(
            'input[value="settings"]',
        );
        fireEvent.click(settingsInput);

        expect(mockNavigate).toHaveBeenCalledWith("/settings");
    });
});
