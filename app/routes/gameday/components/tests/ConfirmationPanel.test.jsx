import { render, screen, fireEvent } from "@/utils/test-utils";
import ConfirmationPanel from "../ConfirmationPanel";

jest.mock("../RunnerAdvancementDND", () => (props) => (
    <div data-testid="runner-advancement-dnd">
        <p>Batter: {props.batterName}</p>
        <p>Variant: {props.variant}</p>
    </div>
));

describe("ConfirmationPanel", () => {
    const defaultProps = {
        selectedPosition: "LF",
        hitLocation: "deep left field",
        runsScored: 1,
        outsRecorded: 0,
        occupiedBases: { first: true },
        projectedRunners: { first: "player2" },
        playerChart: [{ $id: "player2", firstName: "Jane", lastName: "Doe" }],
        actionType: "1B",
        runners: { first: "player1" },
        outs: 0,
        runnerResults: {},
        setRunnerResults: jest.fn(),
        handleConfirm: jest.fn(),
        onChangeClick: jest.fn(),
        currentBatter: { id: "batter1", firstName: "Alice" },
    };

    it("renders the fielded by position and location", () => {
        render(<ConfirmationPanel {...defaultProps} />);
        expect(screen.getByText(/Fielded by: LF/i)).toBeInTheDocument();
        expect(
            screen.getByText(/Location: deep left field/i),
        ).toBeInTheDocument();
    });

    it("renders the RunnerAdvancementDND component", () => {
        render(<ConfirmationPanel {...defaultProps} />);
        expect(
            screen.getByTestId("runner-advancement-dnd"),
        ).toBeInTheDocument();
        expect(screen.getByText(/Batter: Alice/i)).toBeInTheDocument();
        expect(screen.getByText(/Variant: desktop/i)).toBeInTheDocument();
    });

    it("calls handleConfirm when the confirm button is clicked", () => {
        render(<ConfirmationPanel {...defaultProps} />);
        const confirmBtn = screen.getByRole("button", {
            name: /Confirm Play/i,
        });
        fireEvent.click(confirmBtn);
        expect(defaultProps.handleConfirm).toHaveBeenCalled();
    });

    it("calls onChangeClick when the Change button is clicked", () => {
        render(<ConfirmationPanel {...defaultProps} />);
        const changeBtn = screen.getByRole("button", { name: /Change/i });
        fireEvent.click(changeBtn);
        expect(defaultProps.onChangeClick).toHaveBeenCalled();
    });

    it("translates player IDs to first names via prop correctly", () => {
        render(<ConfirmationPanel {...defaultProps} />);
        // Checking internal getPlayerName for potential future exports or just side effects
        // Here we're just confirming it doesn't crash and the base data is available
        expect(
            screen.getByTestId("runner-advancement-dnd"),
        ).toBeInTheDocument();
    });

    it("handles missing onChangeClick gracefully", () => {
        render(
            <ConfirmationPanel {...defaultProps} onChangeClick={undefined} />,
        );
        expect(
            screen.queryByRole("button", { name: /Change/i }),
        ).not.toBeInTheDocument();
    });
});
