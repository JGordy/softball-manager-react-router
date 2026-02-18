import { render, screen, fireEvent } from "@/utils/test-utils";
import AddPlayersDrawer from "../AddPlayersDrawer";

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

describe("AddPlayersDrawer Component", () => {
    const defaultProps = {
        opened: true,
        onClose: jest.fn(),
        playersNotInLineup: [
            {
                $id: "p1",
                firstName: "Player",
                lastName: "One",
                availability: "accepted",
                gender: "F",
            },
            {
                $id: "p2",
                firstName: "Player",
                lastName: "Two",
                availability: "unknown",
                gender: "M",
            },
        ],
        lineupState: [],
        lineupHandlers: {
            append: jest.fn(),
        },
        setHasBeenEdited: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders grouped players correctly", () => {
        render(<AddPlayersDrawer {...defaultProps} />);

        expect(screen.getByTestId("drawer")).toBeInTheDocument();
        expect(screen.getByText("Add Players to Lineup")).toBeInTheDocument();
        expect(screen.getByText(/Accepted/)).toBeInTheDocument();
        expect(screen.getByText(/Unknown/)).toBeInTheDocument();
        expect(
            screen.getByRole("checkbox", { name: "Player One" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("checkbox", { name: "Player Two" }),
        ).toBeInTheDocument();
    });

    it("handles adding players", () => {
        render(<AddPlayersDrawer {...defaultProps} />);

        const addButton = screen.getByRole("button", {
            name: "Add Selected Players",
        });
        expect(addButton).toBeDisabled();

        const playerOneCheckbox = screen.getByRole("checkbox", {
            name: "Player One",
        });
        fireEvent.click(playerOneCheckbox);

        expect(addButton).not.toBeDisabled();

        fireEvent.click(addButton);

        expect(defaultProps.lineupHandlers.append).toHaveBeenCalledWith(
            expect.objectContaining({
                $id: "p1",
                firstName: "Player",
                lastName: "One",
            }),
        );
        expect(defaultProps.setHasBeenEdited).toHaveBeenCalledWith(true);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });
});
