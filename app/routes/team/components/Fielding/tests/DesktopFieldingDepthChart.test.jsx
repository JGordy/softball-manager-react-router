import { render, screen, fireEvent } from "@/utils/test-utils";

import DesktopFieldingDepthChart from "../DesktopFieldingDepthChart";

// Capture the onDragEnd callback so tests can invoke it directly
let capturedOnDragEnd = null;

jest.mock("@hello-pangea/dnd", () => ({
    DragDropContext: ({ children, onDragEnd }) => {
        capturedOnDragEnd = onDragEnd;
        return <div>{children}</div>;
    },
    Droppable: ({ children }) =>
        children(
            {
                draggableProps: {},
                innerRef: jest.fn(),
                placeholder: <div data-testid="placeholder" />,
                droppableProps: {},
            },
            { isDraggingOver: false },
        ),
    Draggable: ({ children }) =>
        children(
            {
                draggableProps: { style: {} },
                dragHandleProps: {},
                innerRef: jest.fn(),
            },
            { isDragging: false },
        ),
}));

jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, opened, title }) =>
            opened ? (
                <div data-testid="drawer" data-title={title}>
                    {children}
                </div>
            ) : null,
);

// Field image constant — avoid broken src in jsdom
jest.mock("@/constants/images", () => ({ fieldSrc: "field.png" }));

describe("DesktopFieldingDepthChart", () => {
    const mockPlayers = [
        {
            $id: "p1",
            firstName: "John",
            lastName: "Doe",
            preferredPositions: ["Pitcher"],
            dislikedPositions: [],
        },
        {
            $id: "p2",
            firstName: "Jane",
            lastName: "Smith",
            preferredPositions: [],
            dislikedPositions: ["Pitcher"],
        },
        {
            $id: "p3",
            firstName: "Sam",
            lastName: "Jones",
            preferredPositions: [],
            dislikedPositions: [],
        },
    ];

    const defaultProps = {
        positioning: { Pitcher: ["p1"] },
        players: mockPlayers,
        handlePositionUpdate: jest.fn(),
        managerView: true,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the field image", () => {
        render(<DesktopFieldingDepthChart {...defaultProps} />);
        expect(screen.getByAltText("Softball Field")).toBeInTheDocument();
    });

    it("renders position hotspots on the field", () => {
        render(<DesktopFieldingDepthChart {...defaultProps} />);
        // Pitcher is the default selected position; its initials appear in the hotspot
        expect(screen.getByLabelText("Select Pitcher")).toBeInTheDocument();
        expect(screen.getByLabelText("Select Catcher")).toBeInTheDocument();
    });

    it("shows the active position title and player count", () => {
        render(<DesktopFieldingDepthChart {...defaultProps} />);
        // Default active position is Pitcher with 1 player
        expect(screen.getByText("Pitcher")).toBeInTheDocument();
        expect(screen.getByText(/1 player/)).toBeInTheDocument();
    });

    it("renders assigned players in the depth chart", () => {
        render(<DesktopFieldingDepthChart {...defaultProps} />);
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    it("shows empty state when position has no players", () => {
        render(
            <DesktopFieldingDepthChart
                {...defaultProps}
                positioning={{ Pitcher: [] }}
            />,
        );
        expect(
            screen.getByText(/No players assigned to Pitcher/),
        ).toBeInTheDocument();
    });

    it("shows 'Add Player' button in managerView", () => {
        render(<DesktopFieldingDepthChart {...defaultProps} />);
        expect(screen.getByText(/Add Player to Pitcher/)).toBeInTheDocument();
    });

    it("does not show 'Add Player' button when managerView is false", () => {
        render(
            <DesktopFieldingDepthChart {...defaultProps} managerView={false} />,
        );
        expect(screen.queryByText(/Add Player to/)).not.toBeInTheDocument();
    });

    it("opens the player selector drawer on Add Player click", () => {
        render(<DesktopFieldingDepthChart {...defaultProps} />);
        fireEvent.click(screen.getByText(/Add Player to Pitcher/));
        expect(screen.getByTestId("drawer")).toBeInTheDocument();
        expect(screen.getByTestId("drawer")).toHaveAttribute(
            "data-title",
            "Add Players to Pitcher",
        );
    });

    it("changes active position when a hotspot is clicked", () => {
        render(<DesktopFieldingDepthChart {...defaultProps} />);
        fireEvent.click(screen.getByLabelText("Select Catcher"));
        expect(screen.getByText("Catcher")).toBeInTheDocument();
        expect(
            screen.getByText(/No players assigned to Catcher/),
        ).toBeInTheDocument();
    });

    describe("PlayerSelector in drawer", () => {
        it("sorts preferred players to the top with a Preferred badge", () => {
            render(<DesktopFieldingDepthChart {...defaultProps} />);
            fireEvent.click(screen.getByText(/Add Player to Pitcher/));

            // John Doe prefers Pitcher — should show Preferred badge
            expect(screen.getByText("Preferred")).toBeInTheDocument();
        });

        it("shows a Dislikes badge for players who dislike the position", () => {
            render(<DesktopFieldingDepthChart {...defaultProps} />);
            fireEvent.click(screen.getByText(/Add Player to Pitcher/));

            // Jane Smith dislikes Pitcher
            expect(screen.getByText("Dislikes")).toBeInTheDocument();
        });

        it("shows no badge for neutral players", () => {
            render(<DesktopFieldingDepthChart {...defaultProps} />);
            fireEvent.click(screen.getByText(/Add Player to Pitcher/));

            // Sam Jones has no preference — no badge
            const badges = screen.queryAllByText("Preferred");
            const dislikeBadges = screen.queryAllByText("Dislikes");
            // Only 1 preferred and 1 disliked — neutral player gets no badge
            expect(badges).toHaveLength(1);
            expect(dislikeBadges).toHaveLength(1);
        });
    });

    describe("depth chart drag-and-drop reorder", () => {
        const twoPlayerProps = {
            positioning: { Pitcher: ["p1", "p2"] },
            players: mockPlayers,
            handlePositionUpdate: jest.fn(),
            managerView: true,
        };

        it("calls handlePositionUpdate with the reordered list when a drag completes", () => {
            render(<DesktopFieldingDepthChart {...twoPlayerProps} />);

            // Simulate dragging p1 (index 0) to index 1
            capturedOnDragEnd({
                source: { index: 0 },
                destination: { index: 1 },
            });

            expect(twoPlayerProps.handlePositionUpdate).toHaveBeenCalledWith(
                "Pitcher",
                // p2 should now come first, p1 second
                [
                    { id: "p2", neverSub: false },
                    { id: "p1", neverSub: false },
                ],
            );
        });

        it("does not call handlePositionUpdate when drag is cancelled (no destination)", () => {
            render(<DesktopFieldingDepthChart {...twoPlayerProps} />);

            capturedOnDragEnd({
                source: { index: 0 },
                destination: null,
            });

            expect(twoPlayerProps.handlePositionUpdate).not.toHaveBeenCalled();
        });

        it("does not call handlePositionUpdate when dropped in the same position", () => {
            render(<DesktopFieldingDepthChart {...twoPlayerProps} />);

            capturedOnDragEnd({
                source: { index: 1 },
                destination: { index: 1 },
            });

            expect(twoPlayerProps.handlePositionUpdate).not.toHaveBeenCalled();
        });
    });
});
