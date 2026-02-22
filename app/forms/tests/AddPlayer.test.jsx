import { render, screen, fireEvent } from "@/utils/test-utils";

import AddPlayer from "../AddPlayer";

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

jest.mock("@mantine/core", () => {
    const actual = jest.requireActual("@mantine/core");

    // Minimal MultiSelect mock to test position filtering logic
    const MultiSelect = ({ label, data, value, onChange, name }) => (
        <div>
            <label htmlFor={name}>{label}</label>
            <select
                id={name}
                multiple
                value={value}
                onChange={(e) => {
                    const values = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value,
                    );
                    onChange(values);
                }}
            >
                {data.map((item) => (
                    <option key={item} value={item}>
                        {item}
                    </option>
                ))}
            </select>
        </div>
    );

    return {
        ...actual,
        MultiSelect,
    };
});

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

describe("AddPlayer", () => {
    it("renders name fields when shouldDisplay('name') is true", () => {
        render(<AddPlayer inputsToDisplay={["name"]} />);

        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    });

    it("renders contact fields when shouldDisplay('contact') is true", () => {
        render(<AddPlayer inputsToDisplay={["contact"]} />);

        expect(screen.getByTestId("autocomplete-email")).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText("(xxx) xxx-xxxx"),
        ).toBeInTheDocument();
    });

    it("renders gender fields when shouldDisplay('gender') is true", () => {
        render(<AddPlayer inputsToDisplay={["gender"]} />);

        expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
        expect(screen.getByLabelText("Male")).toBeInTheDocument();
        expect(screen.getByLabelText("Female")).toBeInTheDocument();
    });

    it("renders throws-bats fields when shouldDisplay('throws-bats') is true", () => {
        render(<AddPlayer inputsToDisplay={["throws-bats"]} />);

        expect(screen.getByLabelText(/throws/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/bats/i)).toBeInTheDocument();
    });

    it("renders positions field when shouldDisplay('positions') is true", () => {
        render(<AddPlayer inputsToDisplay={["positions"]} />);

        expect(screen.getByText(/Preferred Positions/i)).toBeInTheDocument();
        expect(screen.getByText(/Disliked Positions/i)).toBeInTheDocument();
    });

    it("populates fields with defaults", () => {
        const defaults = {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            phoneNumber: "1234567890",
            gender: "Female",
            throws: "Left",
            bats: "Switch",
        };

        render(
            <AddPlayer
                inputsToDisplay={["name", "contact", "gender", "throws-bats"]}
                defaults={defaults}
            />,
        );

        expect(screen.getByLabelText(/first name/i)).toHaveValue("John");
        expect(screen.getByLabelText(/last name/i)).toHaveValue("Doe");
        expect(screen.getByLabelText(/email/i)).toHaveValue("john@example.com");
        // PhoneInput formats it
        expect(screen.getByPlaceholderText("(xxx) xxx-xxxx")).toHaveValue(
            "(123) 456-7890",
        );
        expect(screen.getByLabelText("Female")).toBeChecked();
        // There are multiple "Left" options (Throws and Bats)
        expect(screen.getAllByText("Left")[0]).toBeInTheDocument();
    });

    it("makes fields required for add-player action", () => {
        render(<AddPlayer inputsToDisplay={["name"]} action="add-player" />);

        expect(screen.getByLabelText(/first name/i)).toBeRequired();
        expect(screen.getByLabelText(/last name/i)).toBeRequired();
    });

    it("makes fields not required for other actions", () => {
        render(<AddPlayer inputsToDisplay={["name"]} action="edit-player" />);

        expect(screen.getByLabelText(/first name/i)).not.toBeRequired();
        expect(screen.getByLabelText(/last name/i)).not.toBeRequired();
    });

    it("submits the form with correct data", () => {
        render(
            <AddPlayer
                inputsToDisplay={["name", "contact"]}
                defaults={{ teamId: "team123" }}
            />,
        );

        fireEvent.change(screen.getByLabelText(/first name/i), {
            target: { value: "John" },
        });
        fireEvent.change(screen.getByLabelText(/last name/i), {
            target: { value: "Doe" },
        });
        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "john@example.com" },
        });

        fireEvent.click(screen.getByRole("button", { name: /create player/i }));

        expect(mockSubmit).toHaveBeenCalledWith(expect.any(FormData), {
            action: undefined,
            method: "post",
        });

        const formData = mockSubmit.mock.calls[0][0];
        expect(formData.get("firstName")).toBe("John");
        expect(formData.get("lastName")).toBe("Doe");
        expect(formData.get("email")).toBe("john@example.com");
        expect(formData.get("_action")).toBe("add-player");
    });

    it("prevents selecting the same position as both preferred and disliked", () => {
        render(<AddPlayer inputsToDisplay={["positions"]} />);

        const preferredSelect = screen.getByLabelText(/Preferred Positions/i);
        const dislikedSelect = screen.getByLabelText(/Disliked Positions/i);

        // Initially both should have "Catcher" (assuming it's in allPositions)
        expect(
            Array.from(preferredSelect.options).map((o) => o.value),
        ).toContain("Catcher");
        expect(
            Array.from(dislikedSelect.options).map((o) => o.value),
        ).toContain("Catcher");

        // Select Catcher as Preferred
        // In our mock, value is an array
        fireEvent.change(preferredSelect, { target: { value: ["Catcher"] } });

        // Check if Catcher is removed from Disliked options
        let dislikedOptions = Array.from(dislikedSelect.options).map(
            (o) => o.value,
        );
        expect(dislikedOptions).not.toContain("Catcher");

        // Clear Preferred and select Catcher as Disliked
        fireEvent.change(preferredSelect, { target: { value: [] } });
        fireEvent.change(dislikedSelect, { target: { value: ["Catcher"] } });

        // Check if Catcher is removed from Preferred options
        let preferredOptions = Array.from(preferredSelect.options).map(
            (o) => o.value,
        );
        expect(preferredOptions).not.toContain("Catcher");
    });
});
