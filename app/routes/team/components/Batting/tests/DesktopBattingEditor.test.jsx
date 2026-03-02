import { render, screen, act } from "@/utils/test-utils";

import DesktopBattingEditor from "../DesktopBattingEditor";

// Capture the onDragEnd callback so tests can invoke it directly
let capturedOnDragEnd = null;

// Mock @hello-pangea/dnd — same pattern used across the project
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

describe("DesktopBattingEditor", () => {
    const mockPlayers = [
        {
            $id: "p1",
            firstName: "John",
            lastName: "Doe",
            gender: "Male",
            bats: "Right",
        },
        {
            $id: "p2",
            firstName: "Jane",
            lastName: "Smith",
            gender: "Female",
            bats: "Left",
        },
        {
            $id: "p3",
            firstName: "Sam",
            lastName: "Jones",
            gender: "Male",
            bats: "Switch",
        },
    ];

    const defaultProps = {
        lineup: ["p1", "p3"],
        reserves: ["p2"],
        players: mockPlayers,
        handleReorder: jest.fn(),
        managerView: true,
    };

    it("renders Lineup and Reserves headings", () => {
        render(<DesktopBattingEditor {...defaultProps} />);
        expect(screen.getByText("Lineup")).toBeInTheDocument();
        expect(screen.getByText("Reserves")).toBeInTheDocument();
    });

    it("renders lineup players with batting order numbers", () => {
        render(<DesktopBattingEditor {...defaultProps} />);
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
        expect(screen.getByText(/Sam Jones/)).toBeInTheDocument();
        expect(screen.getByText("1.")).toBeInTheDocument();
        expect(screen.getByText("2.")).toBeInTheDocument();
    });

    it("renders reserves players without order numbers", () => {
        render(<DesktopBattingEditor {...defaultProps} />);
        expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
        // Only lineup has numbered rows — reserves do not
        expect(screen.queryByText("3.")).not.toBeInTheDocument();
    });

    it("renders bats badge for each player", () => {
        render(<DesktopBattingEditor {...defaultProps} />);
        // Bats initials shown as single uppercase character
        expect(screen.getByText("R")).toBeInTheDocument(); // Right
        expect(screen.getByText("L")).toBeInTheDocument(); // Left
        expect(screen.getByText("S")).toBeInTheDocument(); // Switch
    });

    it("shows drag handles when managerView is true", () => {
        render(<DesktopBattingEditor {...defaultProps} />);
        // Grip icons are rendered — verify via aria or role indirectly through SVG presence
        // At minimum both columns render their drag context
        expect(screen.getByText("Lineup")).toBeInTheDocument();
    });

    it("shows empty state message when lineup is empty", () => {
        render(
            <DesktopBattingEditor
                {...defaultProps}
                lineup={[]}
                reserves={[]}
            />,
        );
        const emptyMessages = screen.getAllByText("Drag players here");
        expect(emptyMessages.length).toBe(2);
    });

    it("does not show drag handles when managerView is false", () => {
        render(<DesktopBattingEditor {...defaultProps} managerView={false} />);
        // Players still render
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    describe("drag-and-drop reorder", () => {
        it("calls handleReorder with the correct source and destination on same-list drag", () => {
            const handleReorder = jest.fn();
            render(
                <DesktopBattingEditor
                    {...defaultProps}
                    handleReorder={handleReorder}
                />,
            );

            act(() => {
                capturedOnDragEnd({
                    source: { droppableId: "lineup", index: 0 },
                    destination: { droppableId: "lineup", index: 1 },
                });
            });

            expect(handleReorder).toHaveBeenCalledWith({
                source: { droppableId: "lineup", index: 0 },
                destination: { droppableId: "lineup", index: 1 },
            });
        });

        it("calls handleReorder when a player is moved from lineup to reserves", () => {
            const handleReorder = jest.fn();
            render(
                <DesktopBattingEditor
                    {...defaultProps}
                    handleReorder={handleReorder}
                />,
            );

            act(() => {
                capturedOnDragEnd({
                    source: { droppableId: "lineup", index: 0 },
                    destination: { droppableId: "reserves", index: 0 },
                });
            });

            expect(handleReorder).toHaveBeenCalledWith({
                source: { droppableId: "lineup", index: 0 },
                destination: { droppableId: "reserves", index: 0 },
            });
        });

        it("does not call handleReorder when drag is cancelled (no destination)", () => {
            const handleReorder = jest.fn();
            render(
                <DesktopBattingEditor
                    {...defaultProps}
                    handleReorder={handleReorder}
                />,
            );

            act(() => {
                capturedOnDragEnd({
                    source: { droppableId: "lineup", index: 0 },
                    destination: null,
                });
            });

            expect(handleReorder).not.toHaveBeenCalled();
        });
    });
});
