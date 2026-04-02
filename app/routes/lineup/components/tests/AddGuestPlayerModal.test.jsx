import { render, screen } from "@/utils/test-utils";
import { MemoryRouter } from "react-router";
import AddGuestPlayerModal from "../AddGuestPlayerModal";

// Mock react-router hooks needed for the modal
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigation: jest.fn(() => ({
        state: "idle",
        formData: new FormData(),
    })),
}));

// Mock FormWrapper to simplify testing the logic of the modal itself
jest.mock(
    "@/forms/FormWrapper",
    () =>
        ({ children, action, actionRoute, confirmText, loading }) => (
            <div
                data-testid="form-wrapper"
                data-action={action}
                data-route={actionRoute}
                data-confirm={confirmText}
                data-loading={loading}
            >
                {children}
            </div>
        ),
);

describe("AddGuestPlayerModal", () => {
    const defaultProps = {
        teamId: "team123",
        eventId: "event456",
        actionRoute: "/events/event456/lineup",
    };

    it("renders all required form fields", () => {
        render(
            <MemoryRouter>
                <AddGuestPlayerModal {...defaultProps} />
            </MemoryRouter>,
        );

        // Check for hidden fields
        const teamIdInput = document.querySelector('input[name="teamId"]');
        const eventIdInput = document.querySelector('input[name="eventId"]');
        expect(teamIdInput).toHaveValue("team123");
        expect(eventIdInput).toHaveValue("event456");

        // Check for text inputs
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();

        // Check for gender radio buttons
        expect(screen.getByLabelText("Male")).toBeInTheDocument();
        expect(screen.getByLabelText("Female")).toBeInTheDocument();
    });

    it("passes correct props to FormWrapper", () => {
        render(
            <MemoryRouter>
                <AddGuestPlayerModal {...defaultProps} />
            </MemoryRouter>,
        );

        const formWrapper = screen.getByTestId("form-wrapper");
        expect(formWrapper).toHaveAttribute(
            "data-action",
            "create-guest-player",
        );
        expect(formWrapper).toHaveAttribute(
            "data-route",
            defaultProps.actionRoute,
        );
        expect(formWrapper).toHaveAttribute("data-confirm", "Add Guest Player");
    });

    it("defaults gender to Male", () => {
        render(
            <MemoryRouter>
                <AddGuestPlayerModal {...defaultProps} />
            </MemoryRouter>,
        );

        const maleRadio = screen.getByLabelText("Male");
        expect(maleRadio).toBeChecked();
    });

    it("passes loading true to FormWrapper when action is submitting", () => {
        const { useNavigation } = require("react-router");
        useNavigation.mockReturnValue({
            state: "submitting",
            formData: {
                get: (key) =>
                    key === "_action" ? "create-guest-player" : null,
            },
        });

        render(
            <MemoryRouter>
                <AddGuestPlayerModal {...defaultProps} />
            </MemoryRouter>,
        );

        const formWrapper = screen.getByTestId("form-wrapper");
        expect(formWrapper.getAttribute("data-loading")).toBe("true");
    });
});
