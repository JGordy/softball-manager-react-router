import { render, screen, fireEvent } from "@/utils/test-utils";
import BoxScore, { compareStats } from "./BoxScore";

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

    it("renders player names correctly and renders substitutes nested underneath in default lineup order", () => {
        render(<BoxScore logs={mockLogs} playerChart={mockPlayerChart} />);
        expect(screen.getByText("John")).toBeInTheDocument();
        expect(screen.getByText("Jane")).toBeInTheDocument();
        expect(screen.getByText("Substitute")).toBeInTheDocument();

        // In lineup order, John is first, Substitute is nested next, then Jane
        const rows = screen.getAllByRole("row");
        // Row 0 is header, Row 1 is John, Row 2 is Substitute, Row 3 is Jane, Row 4 is TOTALS
        expect(rows[1]).toHaveTextContent("John");
        expect(rows[2]).toHaveTextContent("Substitute");
        expect(rows[3]).toHaveTextContent("Jane");
    });

    it("renders stats table headers with sort buttons", () => {
        render(<BoxScore logs={mockLogs} playerChart={mockPlayerChart} />);
        expect(
            screen.getByRole("button", { name: "Sort by Batter" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Sort by H" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Sort by AB" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Sort by R" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Sort by RBI" }),
        ).toBeInTheDocument();
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

        expect(screen.getByText("Opponent")).toBeInTheDocument();
        expect(screen.queryByText("John")).not.toBeInTheDocument();

        const row = screen.getByText("Opponent").closest("tr");
        const cells = Array.from(row.querySelectorAll("td")).map(
            (cell) => cell.textContent,
        );

        // Cells format: [Name, AB, H, RBI, R, HR, BB, K, AVG, OBP, OPS]
        expect(cells[1]).toBe("1"); // AB
        expect(cells[2]).toBe("1"); // H
        expect(cells[3]).toBe("2"); // RBI
        expect(cells[4]).toBe("0"); // R
        expect(cells[5]).toBe("1"); // HR
    });

    it("renders aggregate season stats correctly in seasonView and defaults to AVG descending", () => {
        const seasonLogs = [
            { playerId: "p1", eventType: "single", rbi: 1, gameId: "g1" }, // p1: 1 AB, 1 H -> AVG 1.000
            { playerId: "p2", eventType: "strikeout", gameId: "g1" }, // p2: 1 AB, 0 H -> AVG .000
        ];
        const seasonPlayers = [
            { $id: "p2", firstName: "Jane", lastName: "Smith" },
            { $id: "p1", firstName: "John", lastName: "Doe" },
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
        expect(screen.getByText("TOTALS")).toBeInTheDocument();

        // Check that John (AVG 1.000) is sorted before Jane (AVG .000)
        const rows = screen.getAllByRole("row");
        expect(rows[1]).toHaveTextContent("John");
        expect(rows[2]).toHaveTextContent("Jane");
    });

    it("allows sorting by different columns in seasonView and toggles direction", () => {
        const seasonLogs = [
            { playerId: "p1", eventType: "single", rbi: 0, gameId: "g1" }, // p1: 1 AB, 1 H, 0 RBI, AVG 1.000
            { playerId: "p2", eventType: "HR", rbi: 3, gameId: "g1" }, // p2: 1 AB, 1 H, 3 RBI, 1 HR, AVG 1.000
        ];
        const seasonPlayers = [
            { $id: "p1", firstName: "Alice", lastName: "Adams" },
            { $id: "p2", firstName: "Bob", lastName: "Baker" },
        ];

        render(
            <BoxScore
                logs={seasonLogs}
                players={seasonPlayers}
                seasonView={true}
            />,
        );

        // Initially sorted by AVG (Alice first by name tiebreak)
        const initialRows = screen.getAllByRole("row");
        expect(initialRows[1]).toHaveTextContent("Alice");
        expect(initialRows[2]).toHaveTextContent("Bob");

        // Click RBI to sort by RBI descending (Bob has 3 RBI, Alice has 0)
        const rbiButton = screen.getByRole("button", { name: "Sort by RBI" });
        const rbiHeader = rbiButton.closest("th");
        fireEvent.click(rbiButton);
        expect(rbiHeader).toHaveAttribute("aria-sort", "descending");
        const rowsDesc = screen.getAllByRole("row");
        expect(rowsDesc[1]).toHaveTextContent("Bob");
        expect(rowsDesc[2]).toHaveTextContent("Alice");

        // Click RBI again to sort ascending (Alice 0 RBI first)
        fireEvent.click(rbiButton);
        expect(rbiHeader).toHaveAttribute("aria-sort", "ascending");
        const rowsAsc = screen.getAllByRole("row");
        expect(rowsAsc[1]).toHaveTextContent("Alice");
        expect(rowsAsc[2]).toHaveTextContent("Bob");

        // Click RBI again: resets to season default (AVG desc)
        fireEvent.click(rbiButton);
        expect(rbiHeader).toHaveAttribute("aria-sort", "none");
        const avgHeader = screen
            .getByRole("button", { name: "Sort by AVG" })
            .closest("th");
        expect(avgHeader).toHaveAttribute("aria-sort", "descending");

        // Toggle AVG direction via ActionIcon
        const directionButton = screen.getByRole("button", {
            name: /sort ascending|sort descending/i,
        });
        fireEvent.click(directionButton);
        expect(avgHeader).toHaveAttribute("aria-sort", "ascending");
    });

    it("sorts by column header click: descending -> ascending -> default lineup order", () => {
        render(<BoxScore logs={mockLogs} playerChart={mockPlayerChart} />);

        const hButton = screen.getByRole("button", { name: "Sort by H" });
        const hHeader = hButton.closest("th");

        // 1st click: Sort by H Descending (John: 1 H, Substitute: 1 H, Jane: 0 H)
        fireEvent.click(hButton);
        expect(hHeader).toHaveAttribute("aria-sort", "descending");

        // 2nd click: Sort by H Ascending (Jane: 0 H first)
        fireEvent.click(hButton);
        expect(hHeader).toHaveAttribute("aria-sort", "ascending");
        const rowsAsc = screen.getAllByRole("row");
        expect(rowsAsc[1]).toHaveTextContent("Jane");

        // 3rd click: Reset to Lineup Order
        fireEvent.click(hButton);
        expect(hHeader).toHaveAttribute("aria-sort", "none");
        const rowsDefault = screen.getAllByRole("row");
        expect(rowsDefault[1]).toHaveTextContent("John");
        expect(rowsDefault[2]).toHaveTextContent("Substitute");
        expect(rowsDefault[3]).toHaveTextContent("Jane");
    });

    it("sorts text column Batter alphabetical A-Z then Z-A", () => {
        render(<BoxScore logs={mockLogs} playerChart={mockPlayerChart} />);
        const batterButton = screen.getByRole("button", {
            name: "Sort by Batter",
        });
        const batterHeader = batterButton.closest("th");

        // 1st click: Ascending (Jane -> John -> Substitute)
        fireEvent.click(batterButton);
        expect(batterHeader).toHaveAttribute("aria-sort", "ascending");
        const rowsAsc = screen.getAllByRole("row");
        expect(rowsAsc[1]).toHaveTextContent("Jane");
        expect(rowsAsc[2]).toHaveTextContent("John");
        expect(rowsAsc[3]).toHaveTextContent("Substitute");

        // 2nd click: Descending (Substitute -> John -> Jane)
        fireEvent.click(batterButton);
        expect(batterHeader).toHaveAttribute("aria-sort", "descending");
        const rowsDesc = screen.getAllByRole("row");
        expect(rowsDesc[1]).toHaveTextContent("Substitute");
        expect(rowsDesc[2]).toHaveTextContent("John");
        expect(rowsDesc[3]).toHaveTextContent("Jane");

        // 3rd click: Reset to Lineup Order (John -> Substitute -> Jane)
        fireEvent.click(batterButton);
        expect(batterHeader).toHaveAttribute("aria-sort", "none");
        const rowsDefault = screen.getAllByRole("row");
        expect(rowsDefault[1]).toHaveTextContent("John");
    });

    it("allows sorting via the dedicated Select and ActionIcon direction toggle", () => {
        render(<BoxScore logs={mockLogs} playerChart={mockPlayerChart} />);

        // The sort Select input starts with value Lineup Order
        const selectInput = screen.getByRole("combobox", {
            name: "Sort by column",
        });
        expect(selectInput).toHaveValue("Lineup Order");

        // The direction button is initially disabled for Lineup Order
        const directionButton = screen.getByRole("button", {
            name: /sort ascending|sort descending/i,
        });
        expect(directionButton).toBeDisabled();

        // Change sort column via header click (e.g. RBI)
        const rbiButton = screen.getByRole("button", { name: "Sort by RBI" });
        fireEvent.click(rbiButton);

        // Direction button should now be enabled and toggleable
        expect(directionButton).not.toBeDisabled();
        expect(directionButton).toHaveAttribute("aria-label", "Sort ascending");

        // Toggle direction
        fireEvent.click(directionButton);
        expect(directionButton).toHaveAttribute(
            "aria-label",
            "Sort descending",
        );
    });

    it("maintains current batter row highlight when sorted", () => {
        render(
            <BoxScore
                logs={mockLogs}
                playerChart={mockPlayerChart}
                currentBatter={mockPlayerChart[0]}
            />,
        );

        // Sort by Batter ascending (Jane first, then John, then Substitute)
        const batterButton = screen.getByRole("button", {
            name: "Sort by Batter",
        });
        fireEvent.click(batterButton);

        // Substitute should still be highlighted even in sorted order
        const subRow = screen.getByText("Substitute").closest("tr");
        expect(subRow.getAttribute("style")).toContain(
            "var(--mantine-color-blue-light)",
        );
    });

    it("keeps the TOTALS row unchanged in tfoot when sorted", () => {
        render(<BoxScore logs={mockLogs} playerChart={mockPlayerChart} />);

        const hButton = screen.getByRole("button", { name: "Sort by H" });
        fireEvent.click(hButton);

        const totalsRow = screen.getByText("TOTALS").closest("tr");
        expect(totalsRow.parentElement.tagName.toLowerCase()).toBe("tfoot");
        expect(totalsRow).toHaveTextContent("TOTALS");
    });
});

describe("compareStats utility", () => {
    const playerA = {
        player: { firstName: "Alice", lastName: "Apple" },
        AB: 3,
        H: 2,
        RBI: 1,
        AVG: ".667",
        OBP: ".667",
        OPS: "1.334",
    };
    const playerB = {
        player: { firstName: "Bob", lastName: "Banana" },
        AB: 4,
        H: 2,
        RBI: 3,
        AVG: ".500",
        OBP: ".500",
        OPS: "1.000",
    };

    it("compares text columns by name", () => {
        expect(compareStats(playerA, playerB, "player", "asc")).toBeLessThan(0);
        expect(
            compareStats(playerA, playerB, "player", "desc"),
        ).toBeGreaterThan(0);
    });

    it("compares numeric counting stats with tiebreakers", () => {
        // RBI: playerB has 3, playerA has 1
        expect(compareStats(playerA, playerB, "RBI", "desc")).toBeGreaterThan(
            0,
        );
        expect(compareStats(playerA, playerB, "RBI", "asc")).toBeLessThan(0);

        // H tie: both have 2 hits, but playerB has 4 AB vs playerA 3 AB
        expect(compareStats(playerA, playerB, "H", "desc")).toBeGreaterThan(0);
    });

    it("compares rate stats (AVG) correctly", () => {
        expect(compareStats(playerA, playerB, "AVG", "desc")).toBeLessThan(0);
        expect(compareStats(playerA, playerB, "AVG", "asc")).toBeGreaterThan(0);
    });
});
