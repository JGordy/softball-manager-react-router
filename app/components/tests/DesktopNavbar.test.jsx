import * as router from "react-router";
import { MemoryRouter } from "react-router";

import { render, screen, fireEvent } from "@/utils/test-utils";

import DesktopNavbar from "../DesktopNavbar";

// Mock the react-router hooks
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useLocation: jest.fn(),
    useNavigate: jest.fn(),
}));

describe("DesktopNavbar Component", () => {
    const mockNavigate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        router.useNavigate.mockReturnValue(mockNavigate);
        router.useLocation.mockReturnValue({ pathname: "/dashboard" });
    });

    const renderNavbar = (user = null) => {
        return render(
            <MemoryRouter>
                <DesktopNavbar user={user} />
            </MemoryRouter>,
        );
    };

    it("renders basic navigation links", () => {
        renderNavbar();

        expect(screen.getByText("Home")).toBeInTheDocument();
        expect(screen.getByText("Events")).toBeInTheDocument();
        expect(screen.getByText("Profile")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();
        // Admin link shouldn't be there for a normal user
        expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    });

    it("renders Admin link for admin users", () => {
        renderNavbar({ labels: ["admin"] });
        expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("navigates to dashboard when Home is clicked", () => {
        renderNavbar();
        fireEvent.click(screen.getByText("Home"));
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("navigates to events when Events is clicked", () => {
        renderNavbar();
        fireEvent.click(screen.getByText("Events"));
        expect(mockNavigate).toHaveBeenCalledWith("/events");
    });

    it("navigates to user profile when Profile is clicked", () => {
        const user = { $id: "user-123" };
        renderNavbar(user);
        fireEvent.click(screen.getByText("Profile"));
        expect(mockNavigate).toHaveBeenCalledWith("/user/user-123");
    });

    it("sets the active value correctly based on URL", () => {
        router.useLocation.mockReturnValue({ pathname: "/settings" });
        renderNavbar();

        const settingsLink = screen.getByText("Settings").closest("button");
        expect(settingsLink).toHaveAttribute("data-active", "true");
    });
});
