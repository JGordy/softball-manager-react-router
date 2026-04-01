import { render, screen, fireEvent } from "@/utils/test-utils";
import ResetPasswordDrawer from "../ResetPasswordDrawer";

// Mock dependencies
const mockSubmit = jest.fn();
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigation: () => ({ state: "idle" }),
    useSubmit: () => mockSubmit,
    Form: ({ children, onSubmit, ...props }) => (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(e);
            }}
            {...props}
        >
            {children}
        </form>
    ),
}));

jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, title, opened, onClose }) =>
            opened ? (
                <div data-testid="drawer">
                    <h1>{title}</h1>
                    <button onClick={onClose} aria-label="Close">
                        Close
                    </button>
                    {children}
                </div>
            ) : null,
);

jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: () => ({
        closeAllModals: jest.fn(),
    }),
}));

describe("ResetPasswordDrawer", () => {
    const defaultProps = {
        opened: true,
        onClose: jest.fn(),
        user: { id: "1", email: "test@example.com" },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the ResetPasswordDrawer with the UpdatePassword form", () => {
        render(<ResetPasswordDrawer {...defaultProps} />);

        expect(screen.getByText("Reset Password")).toBeInTheDocument();
        expect(
            screen.getByText(/We'll send a link to reset your password/i),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Yes, Reset my Password/i }),
        ).toBeInTheDocument();
    });

    it("submits the form with correct data when CTA is clicked", () => {
        render(<ResetPasswordDrawer {...defaultProps} />);

        fireEvent.click(
            screen.getByRole("button", { name: /Yes, Reset my Password/i }),
        );

        expect(mockSubmit).toHaveBeenCalledWith(expect.any(FormData), {
            action: "/settings",
            method: "post",
        });

        const formData = mockSubmit.mock.calls[0][0];
        expect(formData.get("email")).toBe("test@example.com");
        expect(formData.get("_action")).toBe("password-reset");
    });

    it("calls onClose when the close button is clicked", () => {
        render(<ResetPasswordDrawer {...defaultProps} />);

        fireEvent.click(screen.getByRole("button", { name: /close/i }));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
});
