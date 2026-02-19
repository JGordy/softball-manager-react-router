import { render, screen, fireEvent } from "@/utils/test-utils";

import AddTeam from "../AddTeam";

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

// FormWrapper handles the form logic, so we just test that the correct fields are rendered in AddTeam
describe("AddTeam", () => {
    it("renders all team fields with default labels", () => {
        render(<AddTeam />);

        expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/league name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/gender mix/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/primary color/i)).toBeInTheDocument();
    });

    it("populates fields with initialValues", () => {
        const initialValues = {
            name: "The Sliders",
            displayName: "SLD",
            leagueName: "Friday Night Lights",
            genderMix: "Coed",
            primaryColor: "#ff0000",
        };

        render(<AddTeam initialValues={initialValues} />);

        expect(screen.getByLabelText(/team name/i)).toHaveValue("The Sliders");
        expect(screen.getByLabelText(/display name/i)).toHaveValue("SLD");
        expect(screen.getByLabelText(/league name/i)).toHaveValue(
            "Friday Night Lights",
        );
        expect(screen.getByLabelText("Coed")).toBeChecked();
        expect(screen.getByLabelText(/primary color/i)).toHaveValue("#ff0000");
    });

    it("renders hidden userId input when provided", () => {
        const { container } = render(<AddTeam userId="user123" />);
        const hiddenInput = container.querySelector('input[name="userId"]');
        expect(hiddenInput).toBeInTheDocument();
        expect(hiddenInput).toHaveValue("user123");
    });

    it("displays correct button text for edit-team action", () => {
        render(<AddTeam action="edit-team" />);
        expect(
            screen.getByRole("button", { name: /update team/i }),
        ).toBeInTheDocument();
    });

    it("displays correct button text for add-team action", () => {
        render(<AddTeam action="add-team" />);
        expect(
            screen.getByRole("button", { name: /create team/i }),
        ).toBeInTheDocument();
    });

    it("submits the form with correct data", () => {
        render(<AddTeam action="add-team" />);

        fireEvent.change(screen.getByLabelText(/team name/i), {
            target: { value: "New Team" },
        });
        fireEvent.change(screen.getByLabelText(/display name/i), {
            target: { value: "NT" },
        });

        fireEvent.click(screen.getByRole("button", { name: /create team/i }));

        expect(mockSubmit).toHaveBeenCalledWith(expect.any(FormData), {
            action: undefined,
            method: "post",
        });

        const formData = mockSubmit.mock.calls[0][0];
        expect(formData.get("name")).toBe("New Team");
        expect(formData.get("displayName")).toBe("NT");
        expect(formData.get("_action")).toBe("add-team");
    });
});
