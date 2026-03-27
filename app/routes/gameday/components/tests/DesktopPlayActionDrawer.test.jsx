import { render, screen, fireEvent } from "@/utils/test-utils";

import * as runnerProjectionHook from "../../hooks/useRunnerProjection";
import * as drawerUtils from "../../utils/drawerUtils";

import DesktopPlayActionDrawer from "../DesktopPlayActionDrawer";

// Mock dependencies
jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, opened, title, onClose }) =>
            opened ? (
                <div role="dialog" aria-label={title}>
                    <h1>{title}</h1>
                    <button onClick={onClose}>Close</button>
                    {children}
                </div>
            ) : null,
);

jest.mock("../DiamondView", () => () => <div data-testid="diamond-view" />);
jest.mock("../FieldHighlight", () => () => (
    <div data-testid="field-highlight" />
));

jest.mock("../../hooks/useRunnerProjection");
jest.mock("../../utils/drawerUtils");
jest.mock("../../utils/fieldMapping", () => ({
    getFieldZone: jest.fn().mockReturnValue("left field"),
    getClampedCoordinates: jest.fn().mockImplementation((x, y) => ({ x, y })),
    getRelativePointerCoordinates: jest.fn().mockReturnValue({ x: 50, y: 50 }),
}));

jest.mock("../ConfirmationPanel", () => (props) => (
    <div data-testid="confirmation-panel">
        <p>Fielded by: {props.selectedPosition}</p>
        <p>Location: {props.hitLocation}</p>
        <button onClick={props.handleConfirm}>Confirm Play</button>
    </div>
));

describe("DesktopPlayActionDrawer", () => {
    const mockOnSelect = jest.fn();
    const mockOnClose = jest.fn();
    const defaultProps = {
        opened: true,
        onClose: mockOnClose,
        onSelect: mockOnSelect,
        actionType: "1B",
        runners: { first: null, second: null, third: null },
        playerChart: [],
        currentBatter: { firstName: "Batter", bats: "Right" },
        outs: 0,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        runnerProjectionHook.useRunnerProjection.mockReturnValue({
            runnerResults: {},
            setRunnerResults: jest.fn(),
            projectedRunners: { first: null, second: null, third: null },
            occupiedBases: { first: false, second: false, third: false },
            runsScored: 0,
            outsRecorded: 0,
        });
        drawerUtils.getDrawerTitle.mockReturnValue("Batter singles to...");
        drawerUtils.getRunnerConfigs.mockReturnValue([]);
    });

    it("renders drawer when opened", () => {
        render(<DesktopPlayActionDrawer {...defaultProps} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Batter singles to...")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
        render(<DesktopPlayActionDrawer {...defaultProps} opened={false} />);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("calls onClose when close button clicked", () => {
        render(<DesktopPlayActionDrawer {...defaultProps} />);
        fireEvent.click(screen.getByText("Cancel")); // Using the 'Cancel' button in the Stack
        expect(mockOnClose).toHaveBeenCalled();
    });

    it("renders field view initially", () => {
        render(<DesktopPlayActionDrawer {...defaultProps} />);
        // Initially shows instructions to interact with field
        expect(screen.getByText(/Hover over the field/i)).toBeInTheDocument();
    });

    it("allows locking a position and proceeding to confirmation", async () => {
        render(<DesktopPlayActionDrawer {...defaultProps} />);

        // 1. Initial State: Instruction is visible
        expect(screen.getByText(/Hover over the field/i)).toBeInTheDocument();

        // 2. Interaction: Simulate hovering/clicking a position
        // Find the interactive container (parent of the image)
        const fieldImage = screen.getByAltText(
            /Interactive softball field diagram/i,
        );
        const container = fieldImage.parentElement;

        // Simulate pointer down to lock the position
        fireEvent.pointerDown(container, {
            clientX: 100,
            clientY: 100,
            pointerId: 1,
        });

        // 3. Locked State: Instruction should disappear, 'Unlock' and 'Proceed' should appear
        expect(
            screen.queryByText(/Hover over the field/i),
        ).not.toBeInTheDocument();
        expect(screen.getByText(/Hit to/i)).toBeInTheDocument();
        expect(screen.getByText(/Unlock/i)).toBeInTheDocument();

        const proceedBtn = screen.getByText(/Proceed to Runner Advancement/i);
        fireEvent.click(proceedBtn);

        // 4. Confirmation State: ConfirmationPanel should be visible
        expect(
            await screen.findByTestId("confirmation-panel"),
        ).toBeInTheDocument();
        expect(screen.getByText(/Location: left field/i)).toBeInTheDocument();

        // 5. Finalize: Click confirm in the panel
        fireEvent.click(screen.getByText("Confirm Play"));
        expect(mockOnSelect).toHaveBeenCalledWith(
            expect.objectContaining({
                hitLocation: "left field",
                battingSide: "right",
            }),
        );
    });
});
