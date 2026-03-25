import { render, screen, fireEvent } from "@/utils/test-utils";
import SubPlayerDrawer from "../SubPlayerDrawer";

describe("SubPlayerDrawer", () => {
    const mockOnClose = jest.fn();
    const mockOnConfirmSub = jest.fn();

    const mockSlot = {
        $id: "slot1",
        firstName: "Johnny",
        lastName: "Starter",
        substitutions: [],
    };

    const mockEligibleSubstitutes = [
        { $id: "sub1", firstName: "Bench", lastName: "Player" },
        { $id: "sub2", firstName: "Utility", lastName: "Guy" },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("does not render when closed", () => {
        render(
            <SubPlayerDrawer
                opened={false}
                onClose={mockOnClose}
                currentSlot={mockSlot}
                eligibleSubstitutes={mockEligibleSubstitutes}
                onConfirmSub={mockOnConfirmSub}
            />,
        );
        expect(
            screen.queryByText("Sub Current Batter"),
        ).not.toBeInTheDocument();
    });

    it("renders replacing player identity properly", () => {
        render(
            <SubPlayerDrawer
                opened={true}
                onClose={mockOnClose}
                currentSlot={mockSlot}
                eligibleSubstitutes={mockEligibleSubstitutes}
                onConfirmSub={mockOnConfirmSub}
            />,
        );
        expect(screen.getByText("Sub Current Batter")).toBeInTheDocument();
        expect(screen.getByText("Replacing:")).toBeInTheDocument();
        expect(screen.getByText("Johnny Starter")).toBeInTheDocument();
        expect(screen.queryByText("SUB")).not.toBeInTheDocument();
    });

    it("renders SUB badge if the current player in slot is already a sub", () => {
        const subSlot = {
            ...mockSlot,
            substitutions: [
                {
                    playerId: "sub99",
                    firstName: "Temporary",
                    lastName: "Starter",
                },
            ],
        };
        render(
            <SubPlayerDrawer
                opened={true}
                onClose={mockOnClose}
                currentSlot={subSlot}
                eligibleSubstitutes={mockEligibleSubstitutes}
                onConfirmSub={mockOnConfirmSub}
            />,
        );
        expect(screen.getByText("Temporary Starter")).toBeInTheDocument();
        expect(screen.getByText("SUB")).toBeInTheDocument();
    });

    it("renders empty state when no eligible substitutes exist", () => {
        render(
            <SubPlayerDrawer
                opened={true}
                onClose={mockOnClose}
                currentSlot={mockSlot}
                eligibleSubstitutes={[]}
                onConfirmSub={mockOnConfirmSub}
            />,
        );
        expect(
            screen.getByText("No eligible substitutes available."),
        ).toBeInTheDocument();

        // Confirm Button shouldn't exist
        expect(
            screen.queryByRole("button", { name: /Confirm Sub/i }),
        ).not.toBeInTheDocument();
    });

    it("allows a user to select a substitute and confirm", async () => {
        render(
            <SubPlayerDrawer
                opened={true}
                onClose={mockOnClose}
                currentSlot={mockSlot}
                eligibleSubstitutes={mockEligibleSubstitutes}
                onConfirmSub={mockOnConfirmSub}
            />,
        );

        // Confirm button starts disabled
        const confirmBtn = screen.getByRole("button", { name: /Confirm Sub/i });
        expect(confirmBtn).toBeDisabled();

        // Select the first eligible substitute
        fireEvent.click(screen.getByText("Bench Player"));

        // Confirm button is now enabled
        expect(confirmBtn).toBeEnabled();

        // Click confirm
        fireEvent.click(confirmBtn);

        // Verify callbacks were fired correctly
        expect(mockOnConfirmSub).toHaveBeenCalledTimes(1);
        expect(mockOnConfirmSub).toHaveBeenCalledWith(
            mockEligibleSubstitutes[0],
        );
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("allows a user to cancel the operation", async () => {
        render(
            <SubPlayerDrawer
                opened={true}
                onClose={mockOnClose}
                currentSlot={mockSlot}
                eligibleSubstitutes={mockEligibleSubstitutes}
                onConfirmSub={mockOnConfirmSub}
            />,
        );

        // Click cancel
        const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
        fireEvent.click(cancelBtn);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnConfirmSub).not.toHaveBeenCalled();
    });
});
