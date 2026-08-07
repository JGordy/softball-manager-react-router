import { render, screen, fireEvent, waitFor } from "@/utils/test-utils";
import ContactSprayChart from "./ContactSprayChart";

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

    it("opens filters when filter button is clicked", async () => {
        render(<ContactSprayChart hits={mockHits} />);

        const filterBtn = screen.getByText("Filters");
        fireEvent.click(filterBtn);

        // Check if filter drawer opens with title
        await waitFor(() => {
            expect(screen.getByText("Filter Spray Chart")).toBeInTheDocument();
        });
    });

    it("filters by batting side and displays active filter count badge", () => {
        render(<ContactSprayChart hits={mockHits} />);

        // Click "Left" chip
        const leftChip = screen.getByText("Left");
        fireEvent.click(leftChip);

        // Expect hit1 (Right) to disappear and hit2 (Left) to stay
        expect(
            screen.queryByLabelText(/1B at Left Field/i),
        ).not.toBeInTheDocument();
        expect(screen.getByLabelText(/2B at Right Field/i)).toBeInTheDocument();

        // Expect active filter badge to be displayed and accessible
        expect(screen.getByLabelText("Filters active: 1")).toBeInTheDocument();
    });

    it("renders legend labels and stats correctly", () => {
        render(<ContactSprayChart hits={mockHits} />);

        // Verify legend section headers
        expect(screen.getByText("Legend")).toBeInTheDocument();

        // Verify legend items
        expect(screen.getByText("Single")).toBeInTheDocument();
        expect(screen.getByText("Double")).toBeInTheDocument();
        expect(screen.getByText("Triple")).toBeInTheDocument();
        expect(screen.getByText("Home Run")).toBeInTheDocument();
        expect(screen.getByText("Out")).toBeInTheDocument();
        expect(screen.getByText("Error / FC")).toBeInTheDocument();

        // Verify stats calculation: 3 events, 2 hits (single, double) -> .667 AVG
        expect(screen.getByText(/3 events/i)).toBeInTheDocument();
        expect(screen.getByText(/2 hits/i)).toBeInTheDocument();
        expect(screen.getByText(/\.667 AVG/i)).toBeInTheDocument();
    });

    it("renders correctly with layout='stacked' prop", () => {
        const { container } = render(
            <ContactSprayChart hits={mockHits} layout="stacked" />,
        );
        expect(container.firstChild).toBeInTheDocument();
    });
});
