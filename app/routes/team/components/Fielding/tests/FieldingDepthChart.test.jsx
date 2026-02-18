import { render, screen, fireEvent } from "@/utils/test-utils";

import FieldingDepthChart from "../FieldingDepthChart";

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

jest.mock("@mantine/carousel", () => {
    const Carousel = ({ children }) => <div>{children}</div>;
    Carousel.Slide = ({ children }) => <div>{children}</div>;
    return {
        Carousel,
        useAnimationOffsetEffect: jest.fn(),
    };
});

jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, opened, title }) =>
            opened ? <div data-testid="drawer">{children}</div> : null,
);

describe("FieldingDepthChart Component", () => {
    const mockPlayers = [
        { $id: "p1", firstName: "John", lastName: "Doe" },
        { $id: "p2", firstName: "Jane", lastName: "Smith" },
    ];
    const mockPositioning = {
        Pitcher: ["p1"],
        Catcher: [],
    };
    const mockHandlePositionUpdate = jest.fn();

    beforeEach(() => {
        render(
            <FieldingDepthChart
                players={mockPlayers}
                positioning={mockPositioning}
                handlePositionUpdate={mockHandlePositionUpdate}
                managerView={true}
            />,
        );
    });

    it("renders position titles", () => {
        expect(screen.getByText("Pitcher")).toBeInTheDocument();
        expect(screen.getByText("Catcher")).toBeInTheDocument();
    });

    it("renders assigned players in their positions", () => {
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    it("shows add button for empty positions when managerView is true", () => {
        // Multiple Add buttons for different positions
        const addButtons = screen
            .getAllByRole("button")
            .filter((b) => b.textContent === "Add Player");
        expect(addButtons.length).toBeGreaterThan(0);
    });

    it("opens player selector drawer when Add Player is clicked", () => {
        const addButtons = screen.getAllByText("Add Player");
        fireEvent.click(addButtons[0]);

        expect(screen.getByTestId("drawer")).toBeInTheDocument();
    });
});
