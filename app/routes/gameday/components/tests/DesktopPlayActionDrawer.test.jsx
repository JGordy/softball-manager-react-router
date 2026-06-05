/* eslint-disable react/display-name */
import { render, screen, fireEvent } from "@/utils/test-utils";
import { UI_KEYS } from "@/constants/scoring";

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
    resolveFlyPopOut: jest.fn().mockImplementation((x, y) => {
        if (x === null || y === null) return "Fly Out";
        const dx = x - 50;
        const dy = 78 - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist > 38 ? "Fly Out" : "Pop Out";
    }),
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

    it("resolves Fly/Pop Out to Fly Out or Pop Out based on interaction coordinates", async () => {
        const fieldMapping = require("../../utils/fieldMapping");

        // 1. Outfield coordinate
        fieldMapping.getRelativePointerCoordinates.mockReturnValueOnce({
            x: 50,
            y: 20,
        });

        const mockOnSelectOutfield = jest.fn();
        const { unmount } = render(
            <DesktopPlayActionDrawer
                {...defaultProps}
                actionType={UI_KEYS.FLY_POP}
                onSelect={mockOnSelectOutfield}
            />,
        );

        const fieldImage = screen.getByAltText(
            /Interactive softball field diagram/i,
        );
        const container = fieldImage.parentElement;

        fireEvent.pointerDown(container, {
            clientX: 100,
            clientY: 100,
            pointerId: 1,
        });
        fireEvent.click(screen.getByText(/Proceed to Runner Advancement/i));
        fireEvent.click(screen.getByText("Confirm Play"));

        expect(mockOnSelectOutfield).toHaveBeenCalled();
        unmount();

        // 2. Infield coordinate
        fieldMapping.getRelativePointerCoordinates.mockReturnValueOnce({
            x: 50,
            y: 65,
        });
        const mockOnSelectInfield = jest.fn();
        render(
            <DesktopPlayActionDrawer
                {...defaultProps}
                actionType={UI_KEYS.FLY_POP}
                onSelect={mockOnSelectInfield}
            />,
        );

        const fieldImage2 = screen.getByAltText(
            /Interactive softball field diagram/i,
        );
        const container2 = fieldImage2.parentElement;

        fireEvent.pointerDown(container2, {
            clientX: 100,
            clientY: 100,
            pointerId: 1,
        });
        fireEvent.click(screen.getByText(/Proceed to Runner Advancement/i));
        fireEvent.click(screen.getByText("Confirm Play"));

        expect(mockOnSelectInfield).toHaveBeenCalled();
    });

    it("renders with tour class hooks (.tour-spray-field, .tour-field-position-rf, and .tour-proceed-advancement-btn)", () => {
        render(<DesktopPlayActionDrawer {...defaultProps} />);

        // Find the spray field container by class hook
        const fieldContainer = document.querySelector(".tour-spray-field");
        expect(fieldContainer).toBeInTheDocument();

        // RF position button must have the tour-field-position-rf class
        const rfBtn = document.querySelector(".tour-field-position-rf");
        expect(rfBtn).toBeInTheDocument();

        // Simulate locking position so proceed button is shown
        const fieldImage = screen.getByAltText(
            /Interactive softball field diagram/i,
        );
        const container = fieldImage.parentElement;
        fireEvent.pointerDown(container, {
            clientX: 100,
            clientY: 100,
            pointerId: 1,
        });

        // Proceed button must have .tour-proceed-advancement-btn
        const proceedBtn = screen
            .getByText(/Proceed to Runner Advancement/i)
            .closest("button");
        expect(proceedBtn).toHaveClass("tour-proceed-advancement-btn");
    });
});
