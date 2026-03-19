import { render, screen, fireEvent } from "@/utils/test-utils";
import { MemoryRouter } from "react-router";
import useModal from "@/hooks/useModal";

import BulkDeleteGames from "../BulkDeleteGames";

jest.mock("@/hooks/useModal");
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useSubmit: () => jest.fn(),
    useNavigation: () => ({ state: "idle" }),
    Form: ({ children, onSubmit, ...props }) => (
        <form onSubmit={onSubmit} {...props}>
            {children}
        </form>
    ),
}));

describe("BulkDeleteGames", () => {
    const mockSeason = {
        games: [
            {
                $id: "g1",
                gameDate: "2024-05-01T12:00:00Z",
                opponent: "Tigers",
                isHomeGame: true,
                timeZone: "America/New_York",
            },
            {
                $id: "g2",
                gameDate: "2024-05-08T12:00:00Z",
                opponent: "Lions",
                isHomeGame: false,
                timeZone: "America/New_York",
            },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useModal.mockReturnValue({ closeAllModals: jest.fn() });
    });

    const renderForm = (props = {}) => {
        return render(
            <MemoryRouter>
                <BulkDeleteGames
                    season={mockSeason}
                    buttonColor="red"
                    {...props}
                />
            </MemoryRouter>,
        );
    };

    it("renders empty state correctly", () => {
        renderForm({ season: { games: [] } });
        expect(
            screen.getByText("No games available to delete."),
        ).toBeInTheDocument();
        const submitButton = screen.getByRole("button", {
            name: /Delete Games/i,
        });
        expect(submitButton).toBeDisabled();
    });

    it("renders games list correctly", () => {
        renderForm();
        expect(screen.getByText(/Tigers/i)).toBeInTheDocument();
        expect(screen.getByText(/Lions/i)).toBeInTheDocument();
        expect(screen.getByText(/\(H\)/)).toBeInTheDocument();
        expect(screen.getByText(/\(A\)/)).toBeInTheDocument();
    });

    it("toggles game selection and updates submit button", () => {
        renderForm();
        const submitButton = screen.getByRole("button", {
            name: /Delete Games/i,
        });
        expect(submitButton).toBeDisabled();

        const selectAllCheckbox = screen.getByRole("checkbox", {
            name: /Select All/i,
        });
        const checkboxes = screen.getAllByRole("checkbox");
        const gameCheckboxes = checkboxes.filter(
            (cb) => cb !== selectAllCheckbox,
        );

        // Click the first game checkbox
        const firstGameCard = gameCheckboxes[0];
        fireEvent.click(firstGameCard);

        expect(submitButton).not.toBeDisabled();
        expect(submitButton).toHaveTextContent("Delete 1 Game");

        fireEvent.click(firstGameCard); // Unselect
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent("Delete Games");
    });

    it("toggles select all", () => {
        renderForm();

        const selectAllCheckbox = screen.getByRole("checkbox", {
            name: /Select All/i,
        });

        const submitButton = screen.getByRole("button", {
            name: /Delete Games/i,
        });

        fireEvent.click(selectAllCheckbox);
        expect(submitButton).not.toBeDisabled();
        expect(submitButton).toHaveTextContent("Delete 2 Games");

        fireEvent.click(selectAllCheckbox);
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent("Delete Games");
    });
});
