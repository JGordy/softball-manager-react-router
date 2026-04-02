import { useNavigate, useLocation } from "react-router";
import { screen, fireEvent, cleanup } from "@testing-library/react";
import { render } from "@/utils/test-utils";

import NavLinks from "./NavLinks";

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
        useLocation.mockReturnValue({ pathname: "/dashboard" });
    });

    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it("renders all expected navigation links", () => {
        render(<NavLinks user={{}} />);
        expect(
            screen.getByRole("button", { name: /Home/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Events/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Profile/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Settings/i }),
        ).toBeInTheDocument();
    });

    it("renders admin link for admin users", () => {
        render(<NavLinks user={{ labels: ["admin"] }} />);
        expect(
            screen.getByRole("button", { name: /Admin/i }),
        ).toBeInTheDocument();
    });

    it("initializes active tab based on URL (user profile)", () => {
        useLocation.mockReturnValue({ pathname: "/user/123" });
        render(<NavLinks user={{ $id: "123" }} />);
        const profileButton = screen.getByRole("button", { name: /Profile/i });
        expect(profileButton.className).toContain("active");
    });

    it("navigates to Dashboard when Home link is clicked", () => {
        useLocation.mockReturnValue({ pathname: "/events" });
        render(<NavLinks user={{}} />);

        const homeButton = screen.getByRole("button", { name: /Home/i });
        fireEvent.click(homeButton);

        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("navigates to Settings when Settings link is clicked", () => {
        useLocation.mockReturnValue({ pathname: "/dashboard" });
        render(<NavLinks user={{}} />);

        const settingsButton = screen.getByRole("button", {
            name: /Settings/i,
        });
        fireEvent.click(settingsButton);

        expect(mockNavigate).toHaveBeenCalledWith("/settings");
    });
});
