import { render, screen } from "@/utils/test-utils";
import EditablePlayerChart from "../index";

// Mock drag-and-drop primitives to avoid DOM APIs in tests
jest.mock("@hello-pangea/dnd", () => ({
    DragDropContext: ({ children }) => <div>{children}</div>,
    Droppable: ({ children }) =>
        children(
            {
                droppableProps: { "data-testid": "droppable" },
                innerRef: jest.fn(),
                placeholder: null,
            },
            {},
        ),
    Draggable: ({ children }) =>
        children(
            {
                draggableProps: { "data-testid": "draggable" },
                dragHandleProps: {},
                innerRef: jest.fn(),
            },
            {},
        ),
}));

// Mantine's Select component pulls in heavy layout logic and ResizeObservers.
// Swap it with a minimal stub so the suite runs faster while still behaving
// like a standard controlled select element.
jest.mock("@mantine/core", () => {
    const actual = jest.requireActual("@mantine/core");

    const flattenOptions = (data = []) => {
        const options = [];
        data.forEach((item) => {
            if (typeof item === "string") {
                options.push({ value: item, label: item });
            } else if (item?.items) {
                item.items.forEach((value) => {
                    options.push({ value, label: value });
                });
            } else if (item?.value) {
                options.push({
                    value: item.value,
                    label: item.label || item.value,
                });
            }
        });
        return options;
    };

    const Select = ({ data, value, onChange, error, ...rest }) => (
        <select
            data-testid={rest["data-testid"] || "position-select"}
            aria-invalid={error ? "true" : "false"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
        >
            {flattenOptions(data).map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );

    return {
        ...actual,
        Select,
    };
});

describe("EditablePlayerChart Component", () => {
    const defaultProps = {
        handleLineupReorder: jest.fn(),
        playerChart: [
            {
                $id: "p1",
                firstName: "Player",
                lastName: "One",
                positions: ["P"],
            },
            {
                $id: "p2",
                firstName: "Player",
                lastName: "Two",
                positions: ["C"],
            },
        ],
        setPlayerChart: jest.fn(),
        managerView: true,
        players: [
            { $id: "p1", firstName: "Player", lastName: "One" },
            { $id: "p2", firstName: "Player", lastName: "Two" },
        ],
        validationResults: { battingErrors: [], fieldingErrors: {} },
    };

    it("renders table with player rows", () => {
        render(<EditablePlayerChart {...defaultProps} />);

        expect(screen.getByText("Player One")).toBeInTheDocument();
        expect(screen.getByText("Player Two")).toBeInTheDocument();
        expect(screen.getByText("Missing Positions")).toBeInTheDocument();
    });

    it("renders empty state gracefully", () => {
        const props = {
            ...defaultProps,
            playerChart: [],
        };

        render(<EditablePlayerChart {...props} />);

        expect(screen.queryByText("Player One")).not.toBeInTheDocument();
        expect(screen.queryByText("Player Two")).not.toBeInTheDocument();
    });

    it("shows batting validation errors inline", () => {
        const props = {
            ...defaultProps,
            validationResults: {
                battingErrors: [{ playerId: "p1" }],
                fieldingErrors: {},
            },
        };

        render(<EditablePlayerChart {...props} />);

        expect(
            screen.getByLabelText("Batting validation error"),
        ).toBeInTheDocument();
    });

    it("renders missing position avatars when fielding errors exist", () => {
        const props = {
            ...defaultProps,
            validationResults: {
                battingErrors: [],
                fieldingErrors: {
                    inning1: { missing: ["LF"] },
                },
            },
        };

        render(<EditablePlayerChart {...props} />);

        expect(screen.getByText("LF")).toBeInTheDocument();
    });

    it("renders read-only positions in player view", () => {
        const props = {
            ...defaultProps,
            managerView: false,
        };

        render(<EditablePlayerChart {...props} />);

        expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
        expect(screen.getByText("P")).toBeInTheDocument();
        expect(screen.getByText("C")).toBeInTheDocument();
    });

    it("deduplicates and prioritizes preferred positions in dropdown options", () => {
        const props = {
            ...defaultProps,
            playerChart: [
                {
                    $id: "p1",
                    firstName: "John",
                    lastName: "Doe",
                    positions: [
                        "Out",
                        "Out",
                        "Out",
                        "Out",
                        "Out",
                        "Out",
                        "Out",
                    ],
                },
            ],
            players: [
                {
                    $id: "p1",
                    firstName: "John",
                    lastName: "Doe",
                    preferredPositions: ["Catcher", "First Base"],
                    dislikedPositions: ["Catcher", "Pitcher"], // Overlap: Catcher
                },
            ],
        };

        render(<EditablePlayerChart {...props} />);

        // Get the first inning's select (inning1)
        const select = screen.getAllByTestId("position-select")[0];
        const options = Array.from(select.options).map((o) => o.value);

        // "Catcher" should only appear once (it's in both Preferred and Disliked in mock data)
        const catcherOccurrences = options.filter(
            (v) => v === "Catcher",
        ).length;
        expect(catcherOccurrences).toBe(1);

        // "Out" should appear at the top
        expect(options[0]).toBe("Out");

        // "Pitcher" should still be there (in disliked or other, but sanitized)
        expect(options).toContain("Pitcher");
    });
});
