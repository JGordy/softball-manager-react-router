import { render, screen, fireEvent } from "@/utils/test-utils";
import LogoutDrawer from "../LogoutDrawer";

// Mock dependencies
const mockSubmit = jest.fn();
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useSubmit: () => mockSubmit,
    Form: ({ children, action, method, ...props }) => (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                mockSubmit(formData, { action, method });
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

describe("LogoutDrawer", () => {
    const defaultProps = {
        opened: true,
        onClose: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the confirmation message when opened", () => {
        render(<LogoutDrawer {...defaultProps} />);

        expect(screen.getByText("Confirm Log Out")).toBeInTheDocument();
        expect(
            screen.getByText(/Are you sure you want to log out/i),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Yes, Log out/i }),
        ).toBeInTheDocument();
    });

    it("calls onClose when the close button is clicked", () => {
        render(<LogoutDrawer {...defaultProps} />);

        fireEvent.click(screen.getByRole("button", { name: /close/i }));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("fires the form submission with correct data when logout is clicked", () => {
        render(<LogoutDrawer {...defaultProps} />);

        fireEvent.click(screen.getByRole("button", { name: /Yes, Log out/i }));

        expect(mockSubmit).toHaveBeenCalledWith(expect.any(FormData), {
            action: "/settings",
            method: "post",
        });

        const formData = mockSubmit.mock.calls[0][0];
        expect(formData.get("_action")).toBe("logout");
    });
});
