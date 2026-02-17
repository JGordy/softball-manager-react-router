import { render, screen } from "@/utils/test-utils";
import BoxScore from "../BoxScore";

describe("BoxScore", () => {
    const mockLogs = [
        { playerId: "p1", eventType: "1B", rbi: 1, runs: 1 },
        { playerId: "p2", eventType: "K" },
    ];
    const mockPlayerChart = [
        { $id: "p1", firstName: "John", lastName: "Doe" },
        { $id: "p2", firstName: "Jane", lastName: "Smith" },
    ];

    it("renders player names correctly", () => {
        render(<BoxScore logs={mockLogs} playerChart={mockPlayerChart} />);
        expect(screen.getByText("John")).toBeInTheDocument();
        expect(screen.getByText("Jane")).toBeInTheDocument();
    });

    it("renders stats table headers", () => {
        render(<BoxScore logs={mockLogs} playerChart={mockPlayerChart} />);
        expect(screen.getByText("Batter")).toBeInTheDocument();
        expect(screen.getByText("H")).toBeInTheDocument();
        expect(screen.getByText("AB")).toBeInTheDocument();
        expect(screen.getByText("R")).toBeInTheDocument();
        expect(screen.getByText("RBI")).toBeInTheDocument();
    });

    it("highlights current batter", () => {
        render(
            <BoxScore
                logs={mockLogs}
                playerChart={mockPlayerChart}
                currentBatter={mockPlayerChart[0]}
            />,
        );
        const row = screen.getByText("John").closest("tr");
        // Check for style attribute containing the variable
        expect(row.getAttribute("style")).toContain(
            "var(--mantine-color-blue-light)",
        );
    });

    it("handles duplicate first names", () => {
        const duplicatePlayers = [
            { $id: "p1", firstName: "John", lastName: "Doe" },
            { $id: "p3", firstName: "John", lastName: "Smith" },
        ];
        const logs = [
            { playerId: "p1", eventType: "1B", rbi: 1, runs: 1 },
            { playerId: "p3", eventType: "K" },
        ];
        render(<BoxScore logs={logs} playerChart={duplicatePlayers} />);
        expect(screen.getByText("John D.")).toBeInTheDocument();
        expect(screen.getByText("John S.")).toBeInTheDocument();
    });
});
