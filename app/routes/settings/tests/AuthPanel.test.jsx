import { MemoryRouter, useOutletContext } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import useModal from "@/hooks/useModal";

import AuthPanel from "../components/AuthPanel";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useOutletContext: jest.fn(),
    Form: ({ children }) => <form data-testid="mock-form">{children}</form>,
}));

// Mock hooks
jest.mock("@/hooks/useModal");

describe("AuthPanel Component", () => {
    const mockUser = { $id: "user-123" };
    const mockModal = {
        openModal: jest.fn(),
        closeAllModals: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useOutletContext.mockReturnValue({ user: mockUser });
        useModal.mockReturnValue(mockModal);
    });

    it("renders change password option", () => {
        render(
            <MemoryRouter>
                <AuthPanel />
            </MemoryRouter>,
        );

        expect(screen.getByText("Change Password")).toBeInTheDocument();
    });

    it("opens the update password modal", () => {
        render(
            <MemoryRouter>
                <AuthPanel />
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByLabelText("Update Password"));
        expect(mockModal.openModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Update Your Password",
            }),
        );
    });

    it("opens the logout drawer", async () => {
        render(
            <MemoryRouter>
                <AuthPanel />
            </MemoryRouter>,
        );

        const logoutBtn = screen.getByRole("button", { name: /log out/i });
        fireEvent.click(logoutBtn);

        // Wait for the drawer content
        expect(
            await screen.findByText(/are you sure you want to log out/i),
        ).toBeInTheDocument();
    });
});
