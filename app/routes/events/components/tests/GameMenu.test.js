import { render, screen, fireEvent } from "@/utils/test-utils";
import * as modalHooks from "@/hooks/useModal";

import GameMenu from "../GameMenu";

// Mock dependencies
jest.mock("@/hooks/useModal");
jest.mock("@/utils/dateTime", () => ({
    formatForViewerTime: jest.fn(() => "20:00"),
}));

jest.mock("@/components/MenuContainer", () => ({ sections }) => (
    <div data-testid="menu-container">
        {sections.map((section, idx) => (
            <div key={idx} data-testid={`section-${section.label}`}>
                <h3>{section.label}</h3>
                {section.items.map((item, i) => (
                    <button
                        key={item.key || i}
                        onClick={item.onClick}
                        data-testid={`menu-item-${item.key}`}
                    >
                        {item.content}
                    </button>
                ))}
            </div>
        ))}
    </div>
));

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
        modalHooks.default.mockReturnValue({ openModal: mockOpenModal });
    });

    it("renders Danger Zone with Delete option always", () => {
        render(<GameMenu {...defaultProps} />);

        const deleteBtn = screen.getByTestId("menu-item-delete");
        expect(deleteBtn).toBeInTheDocument();

        fireEvent.click(deleteBtn);
        expect(mockOpenDeleteDrawer).toHaveBeenCalled();
    });

    it("renders Edit Game option always", () => {
        render(<GameMenu {...defaultProps} />);

        const editBtn = screen.getByTestId("menu-item-edit");
        expect(editBtn).toBeInTheDocument();

        fireEvent.click(editBtn);
        // Verify openModal called for edit
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Update Game Details",
                children: expect.anything(), // React element
            }),
        );
    });

    it("does NOT render Results option if game is future", () => {
        render(<GameMenu {...defaultProps} gameIsPast={false} />);
        expect(
            screen.queryByTestId("menu-item-results"),
        ).not.toBeInTheDocument();
    });

    it("renders Results option if game is past", () => {
        render(<GameMenu {...defaultProps} gameIsPast={true} />);

        const resultsBtn = screen.getByTestId("menu-item-results");
        expect(resultsBtn).toBeInTheDocument();

        fireEvent.click(resultsBtn);
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Add Results for this game",
            }),
        );
    });

    it("shows 'Add game results' text when no result exists", () => {
        render(<GameMenu {...defaultProps} gameIsPast={true} result={null} />);
        expect(screen.getByText("Add game results")).toBeInTheDocument();
    });

    it("shows 'Update game results' text when result exists", () => {
        render(<GameMenu {...defaultProps} gameIsPast={true} result="won" />);
        expect(screen.getByText("Update game results")).toBeInTheDocument();
    });
});
