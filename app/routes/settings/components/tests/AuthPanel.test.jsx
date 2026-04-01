import { useOutletContext } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import useModal from "@/hooks/useModal";

import AuthPanel from "../AuthPanel";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigation: () => ({ state: "idle" }),
    useOutletContext: jest.fn(),
    Form: ({ children }) => <form data-testid="mock-form">{children}</form>,
}));

// Mock hooks
jest.mock("@/hooks/useModal");

// Mock sub-components to avoid complex Mantine/media-query issues in this unit test
jest.mock("../LogoutDrawer", () => ({
    __esModule: true,
    default: ({ opened }) =>
        opened ? <div data-testid="logout-drawer">Logout Drawer</div> : null,
}));
jest.mock("../ResetPasswordDrawer", () => ({
    __esModule: true,
    default: ({ opened }) =>
        opened ? (
            <div data-testid="reset-password-drawer">Reset Password Drawer</div>
        ) : null,
}));

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
        render(<AuthPanel />);

        expect(screen.getByText("Change Password")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /log out/i }),
        ).toBeInTheDocument();
    });

    it("opens the update password modal", () => {
        render(<AuthPanel />);

        fireEvent.click(screen.getByLabelText("Update Password"));
        expect(mockModal.openModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Update Your Password",
            }),
        );
    });

    it("opens the reset password drawer", () => {
        render(<AuthPanel />);

        fireEvent.click(screen.getByLabelText("Reset Password"));
        expect(screen.getByTestId("reset-password-drawer")).toBeInTheDocument();
    });

    it("opens the logout drawer", () => {
        render(<AuthPanel />);

        fireEvent.click(screen.getByRole("button", { name: /log out/i }));
        expect(screen.getByTestId("logout-drawer")).toBeInTheDocument();
    });
});
