import { render, screen, fireEvent } from "@/utils/test-utils";
import RemovePlayerDrawer from "../RemovePlayerDrawer";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useOutletContext: jest.fn(() => ({ isDesktop: false })),
}));

describe("RemovePlayerDrawer", () => {
    const mockOnClose = jest.fn();
    const mockOnConfirmRemove = jest.fn();

    const mockPlayerChart = [
        {
            $id: "slot1",
            firstName: "Johnny",
            lastName: "Starter",
            substitutions: [],
            removed: false,
        },
        {
            $id: "slot2",
            firstName: "Billy",
            lastName: "Second",
            substitutions: [],
            removed: false,
        },
        {
            $id: "slot3",
            firstName: "Removed",
            lastName: "Player",
            substitutions: [],
            removed: true,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("does not render when closed", () => {
        render(
            <RemovePlayerDrawer
                opened={false}
                onClose={mockOnClose}
                playerChart={mockPlayerChart}
                onConfirmRemove={mockOnConfirmRemove}
            />,
        );
        expect(
            screen.queryByText("Remove Player mid-game"),
        ).not.toBeInTheDocument();
    });

    it("renders active players list and warning in step 1", () => {
        render(
            <RemovePlayerDrawer
                opened={true}
                onClose={mockOnClose}
                playerChart={mockPlayerChart}
                onConfirmRemove={mockOnConfirmRemove}
            />,
        );

        expect(screen.getByText("Remove Player mid-game")).toBeInTheDocument();
        expect(
            screen.getByText(
                /Removing a player from the lineup applies for the remainder of the game/i,
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Select Player to Remove:"),
        ).toBeInTheDocument();

        // Active players should be visible
        expect(screen.getByText("1. Johnny Starter")).toBeInTheDocument();
        expect(screen.getByText("2. Billy Second")).toBeInTheDocument();

        // Removed players should not be visible
        expect(screen.queryByText("3. Removed Player")).not.toBeInTheDocument();
    });

    it("renders empty state when no active players exist", () => {
        const emptyChart = [
            {
                $id: "slot1",
                firstName: "Johnny",
                lastName: "Starter",
                substitutions: [],
                removed: true,
            },
        ];
        render(
            <RemovePlayerDrawer
                opened={true}
                onClose={mockOnClose}
                playerChart={emptyChart}
                onConfirmRemove={mockOnConfirmRemove}
            />,
        );

        expect(
            screen.getByText("No active players in the lineup."),
        ).toBeInTheDocument();
    });

    it("allows selecting a player to proceed to step 2", () => {
        render(
            <RemovePlayerDrawer
                opened={true}
                onClose={mockOnClose}
                playerChart={mockPlayerChart}
                onConfirmRemove={mockOnConfirmRemove}
            />,
        );

        // Click the first player
        fireEvent.click(screen.getByText("1. Johnny Starter"));

        // Title should change
        expect(
            screen.getByText("Configure Player Removal"),
        ).toBeInTheDocument();

        // Selected player card should be visible
        expect(screen.getByText("Selected Player")).toBeInTheDocument();
        expect(screen.getByText("1. Johnny Starter")).toBeInTheDocument();

        // Options should be visible
        expect(
            screen.getByText("Select League Rule / Option:"),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Skip future at-bats (No Penalty)"),
        ).toBeInTheDocument();
        expect(screen.getByText("Automatic Out (Penalty)")).toBeInTheDocument();
    });

    it("allows going back from step 2 to step 1", () => {
        render(
            <RemovePlayerDrawer
                opened={true}
                onClose={mockOnClose}
                playerChart={mockPlayerChart}
                onConfirmRemove={mockOnConfirmRemove}
            />,
        );

        // Transition to step 2
        fireEvent.click(screen.getByText("1. Johnny Starter"));
        expect(
            screen.getByText("Configure Player Removal"),
        ).toBeInTheDocument();

        // Click Back
        fireEvent.click(screen.getByRole("button", { name: "Back" }));

        // Should return to step 1
        expect(screen.getByText("Remove Player mid-game")).toBeInTheDocument();
        expect(screen.getByText("1. Johnny Starter")).toBeInTheDocument();
    });

    it("submits the removal with default skip option", () => {
        render(
            <RemovePlayerDrawer
                opened={true}
                onClose={mockOnClose}
                playerChart={mockPlayerChart}
                onConfirmRemove={mockOnConfirmRemove}
            />,
        );

        // Go to step 2
        fireEvent.click(screen.getByText("1. Johnny Starter"));

        // Click Confirm Removal (default is 'skip')
        fireEvent.click(
            screen.getByRole("button", { name: "Confirm Removal" }),
        );

        expect(mockOnConfirmRemove).toHaveBeenCalledTimes(1);
        expect(mockOnConfirmRemove).toHaveBeenCalledWith(0, "skip");
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("submits the removal with automatic out option", () => {
        const { container } = render(
            <RemovePlayerDrawer
                opened={true}
                onClose={mockOnClose}
                playerChart={mockPlayerChart}
                onConfirmRemove={mockOnConfirmRemove}
            />,
        );

        // Go to step 2
        fireEvent.click(screen.getByText("2. Billy Second"));

        // Select Automatic Out option
        const autoOutRadio = document.querySelector('input[value="auto-out"]');
        fireEvent.click(autoOutRadio);

        // Click Confirm Removal
        fireEvent.click(
            screen.getByRole("button", { name: "Confirm Removal" }),
        );

        expect(mockOnConfirmRemove).toHaveBeenCalledTimes(1);
        expect(mockOnConfirmRemove).toHaveBeenCalledWith(1, "auto-out");
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when Cancel is clicked in step 1", () => {
        render(
            <RemovePlayerDrawer
                opened={true}
                onClose={mockOnClose}
                playerChart={mockPlayerChart}
                onConfirmRemove={mockOnConfirmRemove}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnConfirmRemove).not.toHaveBeenCalled();
    });
});
