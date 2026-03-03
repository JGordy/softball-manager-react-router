import { render, screen, fireEvent } from "@/utils/test-utils";

import DesktopLineupContainer from "../DesktopLineupContainer";

jest.mock("../Batting/DesktopBattingEditor", () => ({ handleReorder }) => (
    <div data-testid="desktop-batting-editor">
        <button
            onClick={() =>
                handleReorder({
                    source: { droppableId: "lineup", index: 0 },
                    destination: { droppableId: "reserves", index: 0 },
                })
            }
        >
            Mock Reorder
        </button>
    </div>
));

jest.mock(
    "../Fielding/DesktopFieldingDepthChart",
    () =>
        ({ handlePositionUpdate }) => (
            <div data-testid="desktop-fielding-chart">
                <button onClick={() => handlePositionUpdate("Pitcher", ["p1"])}>
                    Mock Position Update
                </button>
            </div>
        ),
);

describe("DesktopLineupContainer", () => {
    const defaultProps = {
        managerView: true,
        players: [{ $id: "p1" }, { $id: "p2" }],
        lineup: ["p1"],
        reserves: ["p2"],
        idealPositioning: {},
        handleBattingReorder: jest.fn(),
        handlePositionUpdate: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the Batting Order tab by default", () => {
        render(<DesktopLineupContainer {...defaultProps} />);
        expect(
            screen.getByTestId("desktop-batting-editor"),
        ).toBeInTheDocument();
    });

    it("renders tab labels", () => {
        render(<DesktopLineupContainer {...defaultProps} />);
        expect(screen.getByText("Batting Order")).toBeInTheDocument();
        expect(screen.getByText("Fielding Depth Chart")).toBeInTheDocument();
    });

    it("switches to Fielding Depth Chart tab on click", () => {
        render(<DesktopLineupContainer {...defaultProps} />);
        fireEvent.click(screen.getByText("Fielding Depth Chart"));
        expect(
            screen.getByTestId("desktop-fielding-chart"),
        ).toBeInTheDocument();
    });

    it("forwards handleBattingReorder to DesktopBattingEditor", () => {
        render(<DesktopLineupContainer {...defaultProps} />);
        fireEvent.click(screen.getByText("Mock Reorder"));
        expect(defaultProps.handleBattingReorder).toHaveBeenCalledWith(
            expect.objectContaining({
                source: { droppableId: "lineup", index: 0 },
                destination: { droppableId: "reserves", index: 0 },
            }),
        );
    });

    it("forwards handlePositionUpdate to DesktopFieldingDepthChart", () => {
        render(<DesktopLineupContainer {...defaultProps} />);
        fireEvent.click(screen.getByText("Fielding Depth Chart"));
        fireEvent.click(screen.getByText("Mock Position Update"));
        expect(defaultProps.handlePositionUpdate).toHaveBeenCalledWith(
            "Pitcher",
            ["p1"],
        );
    });
});
