import { render, screen } from "@/utils/test-utils";
import BoxScore from "./BoxScore";

describe("BoxScore", () => {
    const mockLogs = [
        { playerId: "p1", eventType: "1B", rbi: 1, runs: 1 },
        { playerId: "p2", eventType: "K" },
        { playerId: "sub1", eventType: "HR", rbi: 2, runs: 1 },
    ];
    const mockPlayerChart = [
        {
            $id: "p1",
            firstName: "John",
            lastName: "Doe",
            substitutions: [
                {
                    playerId: "sub1",
                    firstName: "Substitute",
                    lastName: "Player",
                },
            ],
        },
        { $id: "p2", firstName: "Jane", lastName: "Smith" },
    ];

    it("renders player names correctly and renders substitutes nested underneath", () => {
        render(<BoxScore logs={mockLogs} playerChart={mockPlayerChart} />);
        expect(screen.getByText("John")).toBeInTheDocument();
        expect(screen.getByText("Jane")).toBeInTheDocument();
        expect(screen.getByText("Substitute")).toBeInTheDocument();
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
        // "John" is the starter, but "Substitute" is active
        const starterRow = screen.getByText("John").closest("tr");
        const subRow = screen.getByText("Substitute").closest("tr");

        expect(starterRow.getAttribute("style") || "").not.toContain(
            "var(--mantine-color-blue-light)",
        );
        expect(subRow.getAttribute("style")).toContain(
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

    it("renders player jersey numbers in the table", () => {
        const jerseyPlayers = [
            {
                $id: "p1",
                firstName: "John",
                lastName: "Doe",
                jerseyNumber: "10",
            },
            {
                $id: "p2",
                firstName: "Jane",
                lastName: "Smith",
                substitutions: [
                    {
                        playerId: "sub1",
                        firstName: "Substitute",
                        lastName: "Player",
                        jerseyNumber: "99",
                    },
                ],
            },
        ];
        render(<BoxScore logs={mockLogs} playerChart={jerseyPlayers} />);
        expect(screen.getByText("#10")).toBeInTheDocument();
        expect(screen.getByText("#99")).toBeInTheDocument();
    });

    it("renders opponent stats correctly when isOpponent is true", () => {
        const mockOpponentChart = [
            { $id: "OPP_BAT_1", firstName: "Opponent", lastName: "One" },
        ];
        const opponentLogs = [
            { playerId: "p1", eventType: "1B", rbi: 1, runs: 1 }, // our play, should be ignored
            {
                playerId: "OPP_BAT_1",
                eventType: "HR",
                rbi: 2,
                baseState: JSON.stringify({ isOpponent: true }),
            }, // opponent play
        ];

        render(
            <BoxScore
                logs={opponentLogs}
                playerChart={mockOpponentChart}
                isOpponent={true}
                isHomeGame={true}
            />,
        );

        // Expect the opponent's name to be rendered
        expect(screen.getByText("Opponent")).toBeInTheDocument();

        // The our-team player (p1) is not in mockOpponentChart, so they shouldn't render at all
        expect(screen.queryByText("John")).not.toBeInTheDocument();

        // Find the table row containing "Opponent" and assert on its stats
        const row = screen.getByText("Opponent").closest("tr");
        const cells = Array.from(row.querySelectorAll("td")).map(
            (cell) => cell.textContent,
        );

        // Cells format: [Name, AB, H, RBI, R, HR, BB, K, AVG, OBP, OPS]
        expect(cells[1]).toBe("1"); // AB
        expect(cells[2]).toBe("1"); // H
        expect(cells[3]).toBe("2"); // RBI
        expect(cells[4]).toBe("0"); // R (HR scorer is added to R only if scored array has it, but HR counts as at-bat and hit)
        expect(cells[5]).toBe("1"); // HR
    });

    it("renders aggregate season stats correctly in seasonView", () => {
        const seasonLogs = [
            { playerId: "p1", eventType: "single", rbi: 1, gameId: "g1" },
            { playerId: "p1", eventType: "double", rbi: 1, gameId: "g2" },
            { playerId: "p2", eventType: "strikeout", gameId: "g1" },
        ];
        const seasonPlayers = [
            { $id: "p1", firstName: "John", lastName: "Doe" },
            { $id: "p2", firstName: "Jane", lastName: "Smith" },
        ];

        render(
            <BoxScore
                logs={seasonLogs}
                players={seasonPlayers}
                seasonView={true}
            />,
        );

        expect(screen.getByText("John")).toBeInTheDocument();
        expect(screen.getByText("Jane")).toBeInTheDocument();

        // Verify totals row
        expect(screen.getByText("TOTALS")).toBeInTheDocument();
    });
});
