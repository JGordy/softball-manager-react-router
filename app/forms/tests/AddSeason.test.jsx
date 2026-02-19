import { render, screen, fireEvent } from "@/utils/test-utils";

import AddSeason from "../AddSeason";

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

jest.mock("../components/LocationInput", () => {
    return function MockLocationInput() {
        return <div data-testid="location-input">Location Input</div>;
    };
});

describe("AddSeason", () => {
    it("renders all season fields", () => {
        render(<AddSeason teamId="team123" />);

        expect(screen.getByLabelText(/season name/i)).toBeInTheDocument();
        expect(screen.getByTestId("location-input")).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(/What day\(s\) are games played\?/i),
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(/Select Gender/i),
        ).toBeInTheDocument();
        expect(screen.getByLabelText(/sign up fee/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/season start date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/season end date/i)).toBeInTheDocument();
    });

    it("renders hidden teamId input", () => {
        const { container } = render(<AddSeason teamId="team123" />);
        const hiddenInput = container.querySelector('input[name="teamId"]');
        expect(hiddenInput).toBeInTheDocument();
        expect(hiddenInput).toHaveValue("team123");
    });

    it("makes fields required for add-season action", () => {
        render(<AddSeason action="add-season" />);

        expect(screen.getByLabelText(/season name/i)).toBeRequired();
        expect(screen.getByPlaceholderText(/Select Gender/i)).toBeRequired();
    });

    it("displays correct button text for edit-season action", () => {
        render(<AddSeason action="edit-season" confirmText="Update" />);
        expect(
            screen.getByRole("button", { name: /update/i }),
        ).toBeInTheDocument();
    });

    it("submits the form with correct data", () => {
        render(<AddSeason teamId="team123" />);

        fireEvent.change(screen.getByLabelText(/season name/i), {
            target: { value: "Spring 2026" },
        });

        const submitButton = screen.getByRole("button", {
            name: /create season/i,
        });
        fireEvent.submit(submitButton.closest("form"));

        expect(mockSubmit).toHaveBeenCalledWith(expect.any(FormData), {
            action: undefined,
            method: "post",
        });

        const formData = mockSubmit.mock.calls[0][0];
        expect(formData.get("seasonName")).toBe("Spring 2026");
        expect(formData.get("teamId")).toBe("team123");
        expect(formData.get("_action")).toBe("add-season");
    });
});
