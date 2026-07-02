import { render, screen, fireEvent } from "@/utils/test-utils";
import SelectOpponentBatterDrawer from "../SelectOpponentBatterDrawer";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useOutletContext: jest.fn(() => ({ isDesktop: false })),
}));

describe("SelectOpponentBatterDrawer", () => {
    const defaultProps = {
        opened: true,
        onClose: jest.fn(),
        opponentOrderIndex: 5, // Batter 6
        onSelectOpponentBatter: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders title and list of batters correctly", () => {
        render(<SelectOpponentBatterDrawer {...defaultProps} />);

        expect(
            screen.getByText("Set Active Opponent Batter"),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Select which batter slot is currently at the plate:",
            ),
        ).toBeInTheDocument();

        // Should render 12 batter buttons
        for (let i = 1; i <= 12; i++) {
            expect(
                screen.getByRole("button", { name: `Batter ${i}` }),
            ).toBeInTheDocument();
        }
    });

    it("calls onSelectOpponentBatter and onClose when a batter button is clicked", () => {
        render(<SelectOpponentBatterDrawer {...defaultProps} />);

        // Click Batter 3 (index 2)
        const batterButton = screen.getByRole("button", { name: "Batter 3" });
        fireEvent.click(batterButton);

        expect(defaultProps.onSelectOpponentBatter).toHaveBeenCalledWith(2);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when the cancel button is clicked", () => {
        render(<SelectOpponentBatterDrawer {...defaultProps} />);

        const cancelButton = screen.getByRole("button", { name: "Cancel" });
        fireEvent.click(cancelButton);

        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("renders nothing when closed", () => {
        render(<SelectOpponentBatterDrawer {...defaultProps} opened={false} />);
        // Drawer container shouldn't render internal children
        expect(
            screen.queryByText("Set Active Opponent Batter"),
        ).not.toBeInTheDocument();
    });

    it("renders more than 12 slots if opponentChart is larger", () => {
        const mockOpponentChart = Array.from({ length: 15 }).map((_, i) => ({
            $id: `OPP_BAT_${i + 1}`,
            firstName: "Batter",
            lastName: `${i + 1}`,
        }));

        render(
            <SelectOpponentBatterDrawer
                {...defaultProps}
                opponentChart={mockOpponentChart}
            />,
        );

        // Should render 15 batter buttons
        for (let i = 1; i <= 15; i++) {
            expect(
                screen.getByRole("button", { name: `Batter ${i}` }),
            ).toBeInTheDocument();
        }
    });
});
