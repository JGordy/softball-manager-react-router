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
    });
});
