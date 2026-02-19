import { render, screen } from "@/utils/test-utils";
import PlayerChart from "../PlayerChart";

describe("PlayerChart", () => {
    const mockData = [
        {
            $id: "player1",
            firstName: "John",
            lastName: "Doe",
            positions: ["Pitcher", "Out", "Shortstop"],
        },
        {
            $id: "player2",
            firstName: "Jane",
            lastName: "Smith",
            positions: ["First Base", "Pitcher", "Out"],
        },
    ];

    it("renders table with player data", () => {
        render(<PlayerChart playerChart={mockData} />);

        // Check headers
        expect(screen.getByText("Player")).toBeInTheDocument();
        // Columns 1 and 2 exist in header and as batting order numbers, so we expect multiple
        expect(screen.getAllByText("1")).toHaveLength(2);
        expect(screen.getAllByText("2")).toHaveLength(2);

        // Check player names (formatted as First L.)
        expect(screen.getByText("John D.")).toBeInTheDocument();
        expect(screen.getByText("Jane S.")).toBeInTheDocument();

        // Check positions mapped to initials
        expect(screen.getAllByText("P")).toHaveLength(2); // One for John, one for Jane
        expect(screen.getByText("SS")).toBeInTheDocument();
        expect(screen.getByText("1B")).toBeInTheDocument();

        // Check "Out" entries
        // Note: "Out" appears twice (once for John, once for Jane)
        // Adjust expectation based on number of "Out"s
        const outElements = screen.getAllByText("Out");
        expect(outElements.length).toBeGreaterThanOrEqual(2);
    });

    it("renders nothing if playerChart is null/undefined", () => {
        render(<PlayerChart playerChart={null} />);
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
});
