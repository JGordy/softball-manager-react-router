import { render, screen, fireEvent } from "@/utils/test-utils";
import RunnerAdvancementDND from "../RunnerAdvancementDND";

// Mock the CSS module
jest.mock("../GamedayField.module.css", () => ({
    fieldContainer: "fieldContainer",
    baseTarget: "baseTarget",
    runnerBadge: "runnerBadge",
    runnerBadgeDragging: "runnerBadgeDragging",
    outZone: "outZone",
    baseTargetHovered: "baseTargetHovered",
    baseTargetBlocked: "baseTargetBlocked",
}));

jest.mock("../../utils/fieldMapping", () => ({
    getRelativePointerCoordinates: jest.fn().mockReturnValue({ x: 50, y: 50 }),
}));

describe("RunnerAdvancementDND", () => {
    const mockSetRunnerResults = jest.fn();
    const defaultProps = {
        runners: { first: "player1", second: null, third: null },
        runnerResults: {
            first: "stay",
            second: "stay",
            third: "stay",
            batter: "stay",
        },
        setRunnerResults: mockSetRunnerResults,
        playerChart: [
            { $id: "player1", firstName: "John" },
            { $id: "batter1", firstName: "Jane" },
        ],
        actionType: "1B",
        batterId: "batter1",
        batterName: "Jane",
        variant: "mobile",
        runsScored: 0,
        outsRecorded: 0,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the field container with runners on mobile", () => {
        render(<RunnerAdvancementDND {...defaultProps} />);

        // Find the runner badge for player1
        expect(screen.getByText("John")).toBeInTheDocument();
        // Find the batter badge
        expect(screen.getByText("Jane")).toBeInTheDocument();
    });

    it("displays RBI and OUT badges correctly", () => {
        const props = {
            ...defaultProps,
            runnerResults: {
                ...defaultProps.runnerResults,
                first: "score",
                batter: "out",
            },
            runsScored: 1,
            outsRecorded: 1,
        };
        render(<RunnerAdvancementDND {...props} />);

        expect(screen.getByText("1 RBI")).toBeInTheDocument();
        expect(screen.getByText("1 OUT")).toBeInTheDocument();
    });

    it("renders all base targets including out-zone", () => {
        render(<RunnerAdvancementDND {...defaultProps} />);

        // BASE_POSITIONS has 5 entries: home, 1, 2, 3, out-zone
        // The SVG/Paper elements are rendered for each
        const outText = screen.getByText("OUT");
        expect(outText).toBeInTheDocument();
    });

    it("switches to desktop DND mode when variant is desktop", () => {
        render(<RunnerAdvancementDND {...defaultProps} variant="desktop" />);

        // In desktop mode, we use DragDropContext.
        // We can check for the presence of elements that are only in the desktop branch.
        const svg = document.querySelector("svg path");
        expect(svg).toBeInTheDocument();
    });

    it("handles pointer down on runner badge without error", () => {
        render(<RunnerAdvancementDND {...defaultProps} />);
        const runnerBadge = screen.getByText("John");
        fireEvent.pointerDown(runnerBadge, {
            clientX: 100,
            clientY: 100,
            pointerId: 1,
        });
    });

    it("positions the ghost badge using percentage units", () => {
        const { container } = render(
            <RunnerAdvancementDND {...defaultProps} />,
        );
        const runnerBadge = screen.getByText("John");

        // Start drag
        fireEvent.pointerDown(runnerBadge, {
            clientX: 100,
            clientY: 100,
            pointerId: 1,
        });

        // Move drag to 50, 50 (middle)
        // We need to mock the container dimensions for getRelativePointerCoordinates
        // But since we already have it mocked in MobilePlayActionDrawer.test.jsx,
        // let's just check the style of the rendered ghost badge.

        // The ghost badge is in a Box with absolute position.
        // Let's find the ghost badge by its text.
        const ghost = screen
            .getAllByText("John")
            .find((el) => el.closest('[style*="position: absolute"]'));
        if (ghost) {
            const box = ghost.closest('[style*="position: absolute"]');
            expect(box.style.left).toMatch(/%/);
            expect(box.style.top).toMatch(/%/);
        }

        // Verify "DRAG TO" hint is now visible
        expect(screen.getByText("DRAG TO")).toBeInTheDocument();
    });

    it("correctly resolves the batter name when given the 'Batter' sentinel ID", () => {
        const props = {
            ...defaultProps,
            runners: { first: null, second: null, third: null },
            batterName: "Custom Batter Name",
        };
        render(<RunnerAdvancementDND {...props} />);

        // The component should render the batterName for the batter badge
        expect(screen.getByText("Custom Batter Name")).toBeInTheDocument();
    });

    it("renders container with tour hook class (.tour-runner-advancement-dnd)", () => {
        const { container } = render(
            <RunnerAdvancementDND {...defaultProps} />,
        );
        expect(
            container.querySelector(".tour-runner-advancement-dnd"),
        ).toBeInTheDocument();
    });

    it("successfully drags and drops a runner to an allowed base", () => {
        const {
            getRelativePointerCoordinates,
        } = require("../../utils/fieldMapping");
        getRelativePointerCoordinates.mockImplementation((e) => {
            if (e.type === "pointerdown") return { x: 91, y: 50 };
            if (e.type === "pointermove" || e.type === "pointerup")
                return { x: 50, y: 9 };
            return { x: 50, y: 50 };
        });

        render(<RunnerAdvancementDND {...defaultProps} />);
        const runnerBadge = screen.getByText("John");

        // Start drag on John (at base-1: 91, 50)
        fireEvent.pointerDown(runnerBadge, {
            pointerId: 1,
            button: 0,
        });

        // Move to base-2 (50, 9)
        fireEvent.pointerMove(document.body, {
            pointerId: 1,
        });

        // Drop on base-2
        fireEvent.pointerUp(document.body, {
            pointerId: 1,
        });

        expect(mockSetRunnerResults).toHaveBeenCalled();
        const updateFn = mockSetRunnerResults.mock.calls[0][0];
        const prevResults = defaultProps.runnerResults;
        const newResults = updateFn(prevResults);
        expect(newResults.first).toBe("second"); // John advanced from first to second base
    });

    it("prevents dropping a runner to a blocked base", () => {
        const {
            getRelativePointerCoordinates,
        } = require("../../utils/fieldMapping");
        getRelativePointerCoordinates.mockImplementation((e) => {
            if (e.type === "pointerdown") return { x: 91, y: 50 };
            if (e.type === "pointermove" || e.type === "pointerup")
                return { x: 9, y: 50 };
            return { x: 50, y: 50 };
        });

        const props = {
            ...defaultProps,
            // Add a runner at second who stays, blocking the batter from passing them
            runners: { first: null, second: "player2", third: null },
            runnerResults: {
                first: "stay",
                second: "stay",
                third: "stay",
                batter: "stay",
            },
            batterId: "batter1",
            batterName: "Jane",
        };

        render(<RunnerAdvancementDND {...props} />);
        const batterBadge = screen.getByText("Jane");

        // Start drag on Jane (the batter, hit is 1B so starts at 1B: 91, 50)
        fireEvent.pointerDown(batterBadge, {
            pointerId: 1,
            button: 0,
        });

        // Try to move Jane to 3B (9, 50), passing the runner at 2B (who is staying)
        fireEvent.pointerMove(document.body, {
            pointerId: 1,
        });

        // Release/drop on 3B
        fireEvent.pointerUp(document.body, {
            pointerId: 1,
        });

        // setRunnerResults should not be called because passing is blocked
        expect(mockSetRunnerResults).not.toHaveBeenCalled();
    });

    it("unbinds window listeners and resets state on pointercancel", () => {
        render(<RunnerAdvancementDND {...defaultProps} />);
        const runnerBadge = screen.getByText("John");

        // Start drag
        fireEvent.pointerDown(runnerBadge, {
            pointerId: 1,
            button: 0,
        });

        // Verify "DRAG TO" hint is visible (meaning drag is active)
        expect(screen.getByText("DRAG TO")).toBeInTheDocument();

        // Cancel drag
        fireEvent.pointerCancel(document.body, {
            pointerId: 1,
        });

        // Verify "DRAG TO" is no longer visible (drag state reset)
        expect(screen.queryByText("DRAG TO")).not.toBeInTheDocument();
        expect(mockSetRunnerResults).not.toHaveBeenCalled();
    });
});
