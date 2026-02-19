import { render, screen, fireEvent } from "@/utils/test-utils";
import RemovePlayersDrawer from "../RemovePlayersDrawer";

jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, title, opened, onClose }) =>
            opened ? (
                <div data-testid="drawer">
                    <h1>{title}</h1>
                    <button onClick={onClose}>Close</button>
                    {children}
                </div>
            ) : null,
);

describe("RemovePlayersDrawer Component", () => {
    const defaultProps = {
        opened: true,
        onClose: jest.fn(),
        lineupState: [
            { $id: "p1", firstName: "Player", lastName: "One" },
            { $id: "p2", firstName: "Player", lastName: "Two" },
        ],
        lineupHandlers: {
            remove: jest.fn(),
        },
        setHasBeenEdited: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders players correctly", () => {
        render(<RemovePlayersDrawer {...defaultProps} />);

        expect(
            screen.getByText("Remove Players from Lineup"),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("checkbox", { name: "Player One" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("checkbox", { name: "Player Two" }),
        ).toBeInTheDocument();
    });

    it("handles removing players", () => {
        render(<RemovePlayersDrawer {...defaultProps} />);

        const removeButton = screen.getByRole("button", {
            name: "Remove Selected Players",
        });
        expect(removeButton).toBeDisabled();

        const playerOneCheckbox = screen.getByRole("checkbox", {
            name: "Player One",
        });
        fireEvent.click(playerOneCheckbox);

        expect(removeButton).not.toBeDisabled();

        fireEvent.click(removeButton);

        expect(defaultProps.lineupHandlers.remove).toHaveBeenCalledWith(0);
        expect(defaultProps.setHasBeenEdited).toHaveBeenCalledWith(true);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });
});
