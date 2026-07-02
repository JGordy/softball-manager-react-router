import { render, screen, fireEvent } from "@/utils/test-utils";
import { UI_KEYS } from "@/constants/scoring";

import * as runnerProjectionHook from "../../hooks/useRunnerProjection";
import * as drawerUtils from "../../utils/drawerUtils";

import MobilePlayActionDrawer from "../MobilePlayActionDrawer";

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

describe("MobilePlayActionDrawer", () => {
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
        render(<MobilePlayActionDrawer {...defaultProps} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Batter singles to...")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
        render(<MobilePlayActionDrawer {...defaultProps} opened={false} />);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("calls onClose when close button clicked", () => {
        render(<MobilePlayActionDrawer {...defaultProps} />);
        fireEvent.click(screen.getByText("Close"));
        expect(mockOnClose).toHaveBeenCalled();
    });

    it("renders field view initially", () => {
        render(<MobilePlayActionDrawer {...defaultProps} />);
        // Initially shows instructions to interact with field
        expect(screen.getByText(/Touch and drag/i)).toBeInTheDocument();
    });

    it("handles field interaction and shows confirmation", async () => {
        render(<MobilePlayActionDrawer {...defaultProps} />);

        // Find the interactive container (the parent of the image that has the ref)
        const fieldImage = screen.getByAltText(
            /Interactive softball field diagram/i,
        );
        const interactiveContainer = fieldImage.parentElement;

        // Simulate a pointer down event (start drag)
        fireEvent.pointerDown(interactiveContainer, {
            clientX: 100,
            clientY: 100,
            pointerId: 1,
        });

        // Simulate releasing the drag
        fireEvent.pointerUp(interactiveContainer);

        // Should now show the confirmation panel instead of instructions
        // (Wait for the re-render after setHitCoordinates and setIsDragging)
        expect(
            await screen.findByTestId("confirmation-panel"),
        ).toBeInTheDocument();
        expect(screen.queryByText(/Touch and drag/i)).not.toBeInTheDocument();

        // Verify we got the hit location from our mock (left field)
        expect(
            await screen.findByText(/Location: left field/i),
        ).toBeInTheDocument();

        // Clicking confirm should call onSelect
        fireEvent.click(screen.getByText("Confirm Play"));
        expect(mockOnSelect).toHaveBeenCalledWith(
            expect.objectContaining({
                hitLocation: "left field",
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
            <MobilePlayActionDrawer
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
        fireEvent.pointerUp(container);
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
            <MobilePlayActionDrawer
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
        fireEvent.pointerUp(container2);
        fireEvent.click(screen.getByText("Confirm Play"));

        expect(mockOnSelectInfield).toHaveBeenCalled();
    });

    it("renders with tour class hooks (.tour-spray-field and .tour-field-position-rf)", () => {
        render(<MobilePlayActionDrawer {...defaultProps} />);

        // Find the spray field container by class hook
        const fieldContainer = document.querySelector(".tour-spray-field");
        expect(fieldContainer).toBeInTheDocument();

        // RF position button must have the tour-field-position-rf class
        const rfBtn = document.querySelector(".tour-field-position-rf");
        expect(rfBtn).toBeInTheDocument();
    });

    it("defaults battingSide based on defaultBats for switch hitters (left)", () => {
        const switchHitterLeft = {
            ...defaultProps.currentBatter,
            bats: "Switch",
            defaultBats: "left",
        };
        render(
            <MobilePlayActionDrawer
                {...defaultProps}
                currentBatter={switchHitterLeft}
            />,
        );
        expect(screen.getByLabelText("Left")).toBeChecked();
    });

    it("defaults battingSide based on defaultBats for switch hitters (right)", () => {
        const switchHitterRight = {
            ...defaultProps.currentBatter,
            bats: "Switch",
            defaultBats: "right",
        };
        render(
            <MobilePlayActionDrawer
                {...defaultProps}
                currentBatter={switchHitterRight}
            />,
        );
        expect(screen.getByLabelText("Right")).toBeChecked();
    });
});
