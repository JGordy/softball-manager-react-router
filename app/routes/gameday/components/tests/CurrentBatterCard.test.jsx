import { render, screen } from "@/utils/test-utils";
import CurrentBatterCard from "../CurrentBatterCard";

describe("CurrentBatterCard", () => {
    const mockBatter = {
        $id: "p1",
        firstName: "John",
        lastName: "Doe",
    };

    const mockLogs = [
        { playerId: "p1", eventType: "single", rbi: 1 },
        { playerId: "p1", eventType: "strikeout" },
        { playerId: "p1", eventType: "walk" }, // Walk not an AB
        { playerId: "p2", eventType: "homerun" }, // Different player
        { playerId: "subp1", eventType: "single", rbi: 1 }, // Sub hitting
    ];

    it("renders nothing if no current batter", () => {
        const { container } = render(
            <CurrentBatterCard currentBatter={null} logs={mockLogs} />,
        );
        // Should effectively be empty (ignoring style tags injected by Mantine)
        const contentWithoutStyles = Array.from(container.children).filter(
            (child) => child.tagName !== "STYLE",
        );
        expect(contentWithoutStyles.length).toBe(0);
    });

    it("renders batter name", () => {
        render(
            <CurrentBatterCard currentBatter={mockBatter} logs={mockLogs} />,
        );
        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("calculates and displays stats correctly", () => {
        render(
            <CurrentBatterCard currentBatter={mockBatter} logs={mockLogs} />,
        );
        // 1 Hit (1B)
        // AB calculation: 1B (hit), K (out). BB is NOT AB. HR is different player.
        // So 2 ABs. 1/2.
        expect(screen.getByText("1/2")).toBeInTheDocument();
        expect(screen.getByText("1 RBI")).toBeInTheDocument();
        expect(screen.getByText("[1B]")).toBeInTheDocument();
    });

    it("renders correctly with no logs", () => {
        render(<CurrentBatterCard currentBatter={mockBatter} logs={[]} />);
        expect(screen.getByText("0/0")).toBeInTheDocument();
    });

    it("renders substitute identity and SUMS stats when there are substitutions", () => {
        const subBatter = {
            ...mockBatter,
            substitutions: [
                { playerId: "subp1", firstName: "Sub", lastName: "Guy" },
            ],
        };
        render(<CurrentBatterCard currentBatter={subBatter} logs={mockLogs} />);

        // Name should be Sub Guy
        expect(screen.getByText("Sub Guy")).toBeInTheDocument();
        // SUB badge should be visible
        expect(screen.getByText("SUB")).toBeInTheDocument();

        // Stats should SUM John Doe's stats (1/2, 1 RBI) + Sub Guy's stats (1/1, 1 RBI)
        // Total: 2/3, 2 RBI
        expect(screen.getByText("2/3")).toBeInTheDocument();
        expect(screen.getByText("2 RBI")).toBeInTheDocument();
    });
});
