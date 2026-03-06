import { render, screen, fireEvent } from "@/utils/test-utils";
import ConfirmationPanel from "../ConfirmationPanel";

jest.mock("../DiamondView", () => () => <div data-testid="diamond-view" />);
jest.mock("../RunnerPanel", () => () => <div data-testid="runner-panel" />);

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
    };

    it("renders the fielded by position and location", () => {
        render(<ConfirmationPanel {...defaultProps} />);
        expect(screen.getByText("Fielded by: LF")).toBeInTheDocument();
        expect(
            screen.getByText("Location: deep left field"),
        ).toBeInTheDocument();
    });

    it("renders RBI and OUT badges when > 0", () => {
        render(
            <ConfirmationPanel
                {...defaultProps}
                outsRecorded={2}
                runsScored={3}
            />,
        );
        expect(screen.getByText("3 RBIs")).toBeInTheDocument();
        expect(screen.getByText("2 OUTS")).toBeInTheDocument();
    });

    it("renders the DiamondView and RunnerPanel", () => {
        render(<ConfirmationPanel {...defaultProps} />);
        expect(screen.getByTestId("diamond-view")).toBeInTheDocument();
        expect(screen.getByTestId("runner-panel")).toBeInTheDocument();
    });

    it("calls handleConfirm when the confirm button is clicked", () => {
        render(<ConfirmationPanel {...defaultProps} />);
        const confirmBtn = screen.getByRole("button", { name: "Confirm Play" });
        fireEvent.click(confirmBtn);
        expect(defaultProps.handleConfirm).toHaveBeenCalled();
    });

    it("calls onChangeClick when the Change button is clicked", () => {
        render(<ConfirmationPanel {...defaultProps} />);
        const changeBtn = screen.getByRole("button", { name: "Change" });
        fireEvent.click(changeBtn);
        expect(defaultProps.onChangeClick).toHaveBeenCalled();
    });

    it("translates player IDs to first names", () => {
        render(<ConfirmationPanel {...defaultProps} />);
        // 1st base has 'player2' which maps to 'Jane'
        expect(screen.getByText("Jane")).toBeInTheDocument();
    });

    it("handles missing onChangeClick gracefully", () => {
        render(
            <ConfirmationPanel {...defaultProps} onChangeClick={undefined} />,
        );
        expect(
            screen.queryByRole("button", { name: "Change" }),
        ).not.toBeInTheDocument();
    });
});
