import { render, screen, fireEvent } from "@/utils/test-utils";

import UpdateContactInfo from "../UpdateContactInfo";

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

jest.mock("@/components/AutocompleteEmail", () => {
    return function MockAutocompleteEmail({ defaultValue }) {
        return (
            <div data-testid="autocomplete-email">
                <input
                    name="email"
                    aria-label="Email"
                    defaultValue={defaultValue}
                />
            </div>
        );
    };
});

describe("UpdateContactInfo", () => {
    const mockUser = {
        $id: "user123",
        email: "test@example.com",
        name: "Test User",
        teams: [], // Should be stripped
    };

    it("renders all contact update fields", () => {
        render(<UpdateContactInfo user={mockUser} />);

        expect(screen.getByTestId("autocomplete-email")).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText("(xxx) xxx-xxxx"),
        ).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("renders hidden user info with teams stripped", () => {
        const { container } = render(<UpdateContactInfo user={mockUser} />);
        const hiddenInput = container.querySelector('input[name="user"]');
        expect(hiddenInput).toBeInTheDocument();

        const userValue = JSON.parse(hiddenInput.value);
        expect(userValue.teams).toBeUndefined();
        expect(userValue.$id).toBe("user123");
    });

    it("populates fields with defaults", () => {
        const defaults = {
            email: "new@example.com",
            phoneNumber: "1234567890",
        };

        render(<UpdateContactInfo user={mockUser} defaults={defaults} />);

        expect(screen.getByLabelText(/email/i)).toHaveValue("new@example.com");
        expect(screen.getByPlaceholderText("(xxx) xxx-xxxx")).toHaveValue(
            "(123) 456-7890",
        );
    });

    it("shows password description", () => {
        render(<UpdateContactInfo user={mockUser} />);
        expect(
            screen.getByText(/required to update your contact information/i),
        ).toBeInTheDocument();
    });

    it("submits the form with correct data", () => {
        render(<UpdateContactInfo user={mockUser} />);

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "new-email@example.com" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: /update details/i }),
        );

        expect(mockSubmit).toHaveBeenCalledWith(expect.any(FormData), {
            action: undefined,
            method: "post",
        });

        const formData = mockSubmit.mock.calls[0][0];
        expect(formData.get("email")).toBe("new-email@example.com");
        expect(formData.get("_action")).toBe("update-contact");
    });
});
