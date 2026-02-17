import { render, screen, fireEvent } from "@/utils/test-utils";

import * as runnerProjectionHook from "../../hooks/useRunnerProjection";
import * as drawerUtils from "../../utils/drawerUtils";

import PlayActionDrawer from "../PlayActionDrawer";

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
}));

describe("PlayActionDrawer", () => {
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
        render(<PlayActionDrawer {...defaultProps} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Batter singles to...")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
        render(<PlayActionDrawer {...defaultProps} opened={false} />);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("calls onClose when close button clicked", () => {
        render(<PlayActionDrawer {...defaultProps} />);
        fireEvent.click(screen.getByText("Close"));
        expect(mockOnClose).toHaveBeenCalled();
    });

    it("renders field view initially", () => {
        render(<PlayActionDrawer {...defaultProps} />);
        // Initially shows instructions to interact with field
        expect(screen.getByText(/Touch and drag/i)).toBeInTheDocument();
        expect(screen.queryByTestId("diamond-view")).not.toBeInTheDocument();
    });
});
