import { render, screen, fireEvent } from "@/utils/test-utils";
import ContactSprayChart from "../ContactSprayChart";

describe("ContactSprayChart", () => {
    const mockHits = [
        {
            $id: "hit1",
            hitX: 20,
            hitY: 30,
            result: "single",
            battingSide: "RIGHT",
            hitLocation: "Left Field",
        },
        {
            $id: "hit2",
            hitX: 80,
            hitY: 30,
            result: "double",
            battingSide: "LEFT",
            hitLocation: "Right Field",
        },
        {
            $id: "hit3",
            hitX: 50,
            hitY: 50,
            result: "out",
            battingSide: "RIGHT",
            hitLocation: "Center Field",
        },
    ];

    it("renders the field image and markers", () => {
        render(<ContactSprayChart hits={mockHits} />);

        // Check for field image
        expect(screen.getByAltText("Softball Field")).toBeInTheDocument();

        // Check for markers using aria-label
        // Real labels from scoring.js: single -> "1B", double -> "2B", out -> "out"
        expect(screen.getByLabelText(/1B at Left Field/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/2B at Right Field/i)).toBeInTheDocument();
        expect(
            screen.getByLabelText(/Out at Center Field/i),
        ).toBeInTheDocument();
    });

    it("opens filters when filter button is clicked", () => {
        render(<ContactSprayChart hits={mockHits} />);

        const filterBtn = screen.getByText("Filters");
        fireEvent.click(filterBtn);

        // Check if filter options appear (e.g., Result select)
        // Mantine Select might need specific handling or just finding by label
        // Since Select label is "Result", we can look for it.
        // However, Mantine Select renders label as text.
        // Also "Batter", "Location"
        expect(screen.getByText("Result")).toBeInTheDocument();
        expect(screen.getByText("Location")).toBeInTheDocument();
    });

    it("filters by batting side", () => {
        render(<ContactSprayChart hits={mockHits} />);

        // Assuming chips are rendered.
        // Click "Left" chip
        const leftChip = screen.getByText("Left");
        fireEvent.click(leftChip);

        // Expect hit1 (Right) to disappear and hit2 (Left) to stay
        expect(
            screen.queryByLabelText(/1B at Left Field/i),
        ).not.toBeInTheDocument();
        expect(screen.getByLabelText(/2B at Right Field/i)).toBeInTheDocument();
    });
});
