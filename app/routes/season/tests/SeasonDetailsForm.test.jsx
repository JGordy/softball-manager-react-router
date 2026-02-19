import { MemoryRouter } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import SeasonDetailsForm from "../components/SeasonDetailsForm";

// Mock react-router
const mockOnSubmit = jest.fn((e) => e.preventDefault());
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    Form: ({ children, ...props }) => (
        <form {...props} role="form" onSubmit={mockOnSubmit}>
            {children}
        </form>
    ),
    useNavigation: jest.fn(() => ({ state: "idle" })),
}));

describe("SeasonDetailsForm", () => {
    const mockHandleCloseModal = jest.fn();
    const mockSetError = jest.fn();

    const renderForm = () =>
        render(
            <MemoryRouter>
                <SeasonDetailsForm
                    handleCloseModal={mockHandleCloseModal}
                    setError={mockSetError}
                />
            </MemoryRouter>,
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders form fields with correct names for action consumption", () => {
        const { container } = renderForm();

        // React Router actions rely on the 'name' attribute of inputs
        // We verify that inputs with the expected names exist in the form
        expect(
            container.querySelector('[name="seasonName"]'),
        ).toBeInTheDocument();
        expect(
            container.querySelector('[name="location"]'),
        ).toBeInTheDocument();
        expect(
            container.querySelector('[name="leagueType"]'),
        ).toBeInTheDocument();
        expect(
            container.querySelector('[name="signUpFee"]'),
        ).toBeInTheDocument();
        expect(
            container.querySelector('[name="gameDays"]'),
        ).toBeInTheDocument();
        expect(
            container.querySelector('[name="startDate"]'),
        ).toBeInTheDocument();
        expect(container.querySelector('[name="endDate"]')).toBeInTheDocument();
    });

    it("triggers form submission when the submit button is clicked", () => {
        renderForm();

        const submitButton = screen.getByRole("button", { name: /submit/i });

        // Trigger submission via click
        fireEvent.click(submitButton);

        // Verify that the submit button has the correct form action overrides
        // In React Router, the button's name/value are used to determine which action to run
        expect(submitButton).toHaveAttribute("name", "_action");
        expect(submitButton).toHaveAttribute("value", "edit-season");

        // Verify that the form submission event was captured by our mock
        expect(mockOnSubmit).toHaveBeenCalled();
    });

    it("allows entering data in text fields", () => {
        const { container } = renderForm();

        const nameInput = container.querySelector('[name="seasonName"]');
        const locationInput = container.querySelector('[name="location"]');

        fireEvent.change(nameInput, {
            target: { value: "Summer Classic 2026" },
        });
        fireEvent.change(locationInput, { target: { value: "Victory Park" } });

        expect(nameInput).toHaveValue("Summer Classic 2026");
        expect(locationInput).toHaveValue("Victory Park");
    });

    it("closes modal and clears errors when Cancel is clicked", () => {
        renderForm();

        const cancelButton = screen.getByRole("button", { name: /cancel/i });
        fireEvent.click(cancelButton);

        expect(mockHandleCloseModal).toHaveBeenCalled();
        expect(mockSetError).toHaveBeenCalledWith(null);
    });
});
