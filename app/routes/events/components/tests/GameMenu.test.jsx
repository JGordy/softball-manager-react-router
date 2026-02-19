import { render, screen, fireEvent } from "@/utils/test-utils";
import * as modalHooks from "@/hooks/useModal";

import GameMenu from "../GameMenu";

// Mock dependencies
jest.mock("@/hooks/useModal");
jest.mock("@/utils/dateTime", () => ({
    formatForViewerTime: jest.fn(() => "20:00"),
}));

// Mock icons
jest.mock("@tabler/icons-react", () => ({
    IconDots: () => <div data-testid="icon-dots" />,
    IconEdit: () => <div data-testid="icon-edit" />,
    IconTrashX: () => <div data-testid="icon-trash" />,
    IconTrophy: () => <div data-testid="icon-trophy" />,
    IconScoreboard: () => <div data-testid="icon-scoreboard" />,
}));

// Mock Forms to avoid complex rendering
jest.mock("@/forms/AddGameResults", () => () => (
    <div data-testid="add-game-results" />
));
jest.mock("@/forms/AddSingleGame", () => () => (
    <div data-testid="add-single-game" />
));

describe("GameMenu Component", () => {
    const mockOpenModal = jest.fn();
    const mockOpenDeleteDrawer = jest.fn();

    const defaultProps = {
        game: {
            $id: "game1",
            gameDate: "2023-01-01",
            isHomeGame: true,
            score: 0,
        },
        gameIsPast: false,
        openDeleteDrawer: mockOpenDeleteDrawer,
        result: null,
        season: { $id: "season1", location: "Park" },
        team: { $id: "team1" },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        modalHooks.default.mockReturnValue({
            openModal: mockOpenModal,
            closeAllModals: jest.fn(),
        });
    });

    const openMenu = async () => {
        const trigger = screen.getByTestId("icon-dots");
        fireEvent.click(trigger);
        return screen.findByText("Edit Game Details");
    };

    it("renders Danger Zone with Delete option always", async () => {
        render(<GameMenu {...defaultProps} />);

        await openMenu();
        const deleteBtn = screen.getByText("Delete Game");
        expect(deleteBtn).toBeInTheDocument();

        fireEvent.click(deleteBtn);
        expect(mockOpenDeleteDrawer).toHaveBeenCalled();
    });

    it("renders Edit Game Details option always", async () => {
        render(<GameMenu {...defaultProps} />);

        await openMenu();
        const editBtn = screen.getByText("Edit Game Details");
        expect(editBtn).toBeInTheDocument();

        fireEvent.click(editBtn);
        // Verify openModal called for edit
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Update Game Details",
            }),
        );
    });

    it("does NOT render Results option if game is future", async () => {
        render(<GameMenu {...defaultProps} gameIsPast={false} />);

        const trigger = screen.getByTestId("icon-dots");
        fireEvent.click(trigger);

        expect(screen.queryByText(/game results/i)).not.toBeInTheDocument();
    });

    it("renders Results option if game is past and handles click", async () => {
        render(<GameMenu {...defaultProps} gameIsPast={true} />);

        await openMenu();
        const resultsBtn = screen.getByText("Add game results");
        expect(resultsBtn).toBeInTheDocument();

        fireEvent.click(resultsBtn);
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Add Results for this game",
            }),
        );
    });

    it("shows 'Update game results' text when result exists", async () => {
        render(<GameMenu {...defaultProps} gameIsPast={true} result="won" />);
        await openMenu();
        expect(screen.getByText("Update game results")).toBeInTheDocument();
    });
});
