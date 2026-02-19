import { render, screen, fireEvent } from "@/utils/test-utils";

import AddGameResults from "../AddGameResults";

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

describe("AddGameResults", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders score fields and count towards record switch", () => {
        render(<AddGameResults teamId="team123" />);

        expect(screen.getByLabelText(/our score/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/opponent's score/i)).toBeInTheDocument();
        expect(
            screen.getByLabelText(/counts towards record/i),
        ).toBeInTheDocument();
    });

    it("populates fields with defaults", () => {
        const defaults = {
            score: 10,
            opponentScore: 5,
            countTowardsRecord: false,
        };

        render(<AddGameResults teamId="team123" defaults={defaults} />);

        expect(screen.getByLabelText(/our score/i)).toHaveValue("10");
        expect(screen.getByLabelText(/opponent's score/i)).toHaveValue("5");
        expect(
            screen.getByLabelText(/counts towards record/i),
        ).not.toBeChecked();
    });

    it("defaults 'counts towards record' to true if not specified", () => {
        render(<AddGameResults teamId="team123" />);
        expect(screen.getByLabelText(/counts towards record/i)).toBeChecked();
    });

    it("renders hidden teamId input", () => {
        const { container } = render(<AddGameResults teamId="team123" />);
        expect(container.querySelector('input[name="teamId"]')).toHaveValue(
            "team123",
        );
    });

    it("submits the form with correct data", () => {
        render(<AddGameResults teamId="team123" />);

        fireEvent.change(screen.getByLabelText(/our score/i), {
            target: { value: "12" },
        });
        fireEvent.change(screen.getByLabelText(/opponent's score/i), {
            target: { value: "8" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: /update game results/i }),
        );

        expect(mockSubmit).toHaveBeenCalledWith(expect.any(FormData), {
            action: undefined,
            method: "post",
        });

        const formData = mockSubmit.mock.calls[0][0];
        expect(formData.get("score")).toBe("12");
        expect(formData.get("opponentScore")).toBe("8");
        expect(formData.get("teamId")).toBe("team123");
        expect(formData.get("_action")).toBe("update-game");
    });
});
