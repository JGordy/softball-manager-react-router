import { render, screen, fireEvent } from "@/utils/test-utils";

import UpdatePassword from "../UpdatePassword";

const mockSubmit = jest.fn();
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useSubmit: () => mockSubmit,
    Form: ({ children, onSubmit, ...props }) => (
        <form onSubmit={onSubmit} {...props}>
            {children}
        </form>
    ),
}));

jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: () => ({
        closeAllModals: jest.fn(),
        openModal: jest.fn(),
    }),
}));

describe("UpdatePassword", () => {
    describe("Default Update Password", () => {
        it("renders current and new password fields", () => {
            render(<UpdatePassword />);

            expect(
                screen.getByLabelText(/current password/i),
            ).toBeInTheDocument();
            expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
        });

        it("shows password descriptions", () => {
            render(<UpdatePassword />);

            expect(
                screen.getByText(/used to verify your identity/i),
            ).toBeInTheDocument();
            expect(
                screen.getByText(/must be at least 8 characters long/i),
            ).toBeInTheDocument();
        });

        it("renders submit button with default text", () => {
            render(<UpdatePassword />);
            expect(
                screen.getByRole("button", { name: /update password/i }),
            ).toBeInTheDocument();
        });

        it("submits the form with correct data", () => {
            render(<UpdatePassword />);

            fireEvent.change(screen.getByLabelText(/current password/i), {
                target: { value: "old-password" },
            });
            fireEvent.change(screen.getByLabelText(/new password/i), {
                target: { value: "new-password" },
            });

            fireEvent.click(
                screen.getByRole("button", { name: /update password/i }),
            );

            expect(mockSubmit).toHaveBeenCalledWith(expect.any(FormData), {
                action: undefined,
                method: "post",
            });

            const formData = mockSubmit.mock.calls[0][0];
            expect(formData.get("currentPassword")).toBe("old-password");
            expect(formData.get("newPassword")).toBe("new-password");
            expect(formData.get("_action")).toBe("update-password");
        });
    });

    describe("Password Reset Action", () => {
        const mockUser = { email: "reset@example.com" };

        it("renders reset confirmation message", () => {
            render(<UpdatePassword action="password-reset" user={mockUser} />);

            expect(
                screen.getByText(/do you want to continue\?/i),
            ).toBeInTheDocument();
            expect(
                screen.getByText(/we'll send a link to reset your password/i),
            ).toBeInTheDocument();
        });

        it("renders hidden email input", () => {
            const { container } = render(
                <UpdatePassword action="password-reset" user={mockUser} />,
            );
            expect(container.querySelector('input[name="email"]')).toHaveValue(
                "reset@example.com",
            );
        });

        it("hides default FormWrapper buttons and shows a fullWidth button", () => {
            render(<UpdatePassword action="password-reset" user={mockUser} />);

            // FormWrapper buttons are hidden (Confirm/Cancel at the bottom)
            expect(
                screen.queryByRole("button", { name: /cancel/i }),
            ).not.toBeInTheDocument();

            // The one rendered in UpdatePassword itself
            expect(
                screen.getByRole("button", { name: /update password/i }),
            ).toBeInTheDocument();
        });
    });
});
