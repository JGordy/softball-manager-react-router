import { render, screen, fireEvent } from "@/utils/test-utils";

import AddSingleGame from "../AddSingleGame";

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
    return function MockLocationInput({ defaultValue }) {
        return (
            <div data-testid="location-input">
                <input
                    aria-label="Location"
                    name="location"
                    defaultValue={defaultValue}
                />
            </div>
        );
    };
});

describe("AddSingleGame", () => {
    const mockSeasons = [
        { $id: "season1", seasonName: "Spring 2025" },
        { $id: "season2", seasonName: "Fall 2025" },
    ];

    it("renders core game fields", () => {
        render(<AddSingleGame teamId="team123" />);

        expect(screen.getByLabelText(/opponent's name/i)).toBeInTheDocument();
        expect(
            screen.getByLabelText(/select the game location/i),
        ).toBeInTheDocument();
        expect(screen.getByTestId("location-input")).toBeInTheDocument();
        expect(screen.getByLabelText(/location notes/i)).toBeInTheDocument();
    });

    it("renders hidden inputs for IDs", () => {
        const { container } = render(
            <AddSingleGame teamId="team123" seasonId="season456" />,
        );

        expect(container.querySelector('input[name="teamId"]')).toHaveValue(
            "team123",
        );
        expect(container.querySelector('input[name="seasonId"]')).toHaveValue(
            "season456",
        );
    });

    it("renders season select when seasons are provided", async () => {
        render(
            <AddSingleGame
                seasons={mockSeasons}
                teamId="team123"
                seasonId="season1"
            />,
        );
        // Wait for the specific season text to appear (since it's the selected value)
        expect(await screen.findByText("Spring 2025")).toBeInTheDocument();
        // Check for the label as well
        expect(screen.getByText(/Season/i)).toBeInTheDocument();
    });

    it("populates fields with defaults", () => {
        const defaults = {
            opponent: "The Avengers",
            isHomeGame: "true",
            location: "Central Park",
            locationNotes: "Field 3",
        };

        render(<AddSingleGame defaults={defaults} teamId="team123" />);

        expect(screen.getByLabelText(/opponent's name/i)).toHaveValue(
            "The Avengers",
        );
        expect(screen.getByLabelText("Home")).toBeChecked();
        expect(screen.getByLabelText("Location")).toHaveValue("Central Park");
        expect(screen.getByLabelText(/location notes/i)).toHaveValue("Field 3");
    });

    it("submits the form with correct data", () => {
        render(<AddSingleGame teamId="team123" />);

        fireEvent.change(screen.getByLabelText(/opponent's name/i), {
            target: { value: "Wildcats" },
        });

        fireEvent.click(screen.getByRole("button", { name: /create game/i }));

        expect(mockSubmit).toHaveBeenCalledWith(expect.any(FormData), {
            action: undefined,
            method: "post",
        });

        const formData = mockSubmit.mock.calls[0][0];
        expect(formData.get("opponent")).toBe("Wildcats");
        expect(formData.get("teamId")).toBe("team123");
        expect(formData.get("_action")).toBe("add-single-game");
    });
});
