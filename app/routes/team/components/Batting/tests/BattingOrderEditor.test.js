import { render, screen } from "@/utils/test-utils";

import BattingOrderEditor from "../BattingOrderEditor";

// Mock @hello-pangea/dnd
jest.mock("@hello-pangea/dnd", () => ({
    DragDropContext: ({ children }) => <div>{children}</div>,
    Droppable: ({ children }) =>
        children(
            {
                draggableProps: {},
                innerRef: jest.fn(),
                placeholder: <div data-testid="placeholder" />,
            },
            {},
        ),
    Draggable: ({ children }) =>
        children(
            {
                draggableProps: {},
                dragHandleProps: {},
                innerRef: jest.fn(),
            },
            { isDragging: false },
        ),
}));

describe("BattingOrderEditor Component", () => {
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
    ];
    const mockLineup = ["p1"];
    const mockReserves = ["p2"];
    const mockHandleReorder = jest.fn();

    beforeEach(() => {
        render(
            <BattingOrderEditor
                lineup={mockLineup}
                reserves={mockReserves}
                players={mockPlayers}
                handleReorder={mockHandleReorder}
                managerView={true}
            />,
        );
    });

    it("renders lineup and reserves", () => {
        expect(screen.getByText("Batting Order")).toBeInTheDocument();
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
        expect(screen.getByText("Reserves")).toBeInTheDocument();
        expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    });

    it("renders gender and batting badges", () => {
        expect(screen.getByText("Bats: Right")).toBeInTheDocument();
        expect(screen.getByText("Bats: Left")).toBeInTheDocument();
    });

    it("shows player numbers in the lineup section", () => {
        expect(screen.getByText("1.")).toBeInTheDocument();
    });
});
