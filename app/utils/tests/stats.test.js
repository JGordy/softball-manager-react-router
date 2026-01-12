import {
    calculateGameStats,
    calculateTeamTotals,
    calculatePlayerStats,
} from "../stats";

describe("calculateGameStats", () => {
    const mockPlayerChart = [
        { $id: "player1", firstName: "John", lastName: "Doe" },
        { $id: "player2", firstName: "Jane", lastName: "Smith" },
        { $id: "player3", firstName: "Bob", lastName: "Jones" },
    ];

    it("should initialize stats for all players in lineup with zero values", () => {
        const stats = calculateGameStats([], mockPlayerChart);

        expect(stats).toHaveLength(3);
        stats.forEach((stat) => {
            expect(stat.PA).toBe(0);
            expect(stat.AB).toBe(0);
            expect(stat.H).toBe(0);
            expect(stat.RBI).toBe(0);
            expect(stat.BB).toBe(0);
            expect(stat.K).toBe(0);
            expect(stat.AVG).toBe(".000");
            expect(stat.OBP).toBe(".000");
            expect(stat.SLG).toBe(".000");
            expect(stat.OPS).toBe(".000");
        });
    });

    it("should correctly count hits and calculate batting average", () => {
        const logs = [
            {
                playerId: "player1",
                eventType: "single",
                rbi: 0,
                baseState: "{}",
            },
            {
                playerId: "player1",
                eventType: "double",
                rbi: 1,
                baseState: "{}",
            },
            { playerId: "player1", eventType: "out", rbi: 0, baseState: "{}" },
            {
                playerId: "player1",
                eventType: "triple",
                rbi: 2,
                baseState: "{}",
            },
        ];

        const stats = calculateGameStats(logs, mockPlayerChart);
        const player1Stats = stats.find((s) => s.player.$id === "player1");

        expect(player1Stats.PA).toBe(4);
        expect(player1Stats.AB).toBe(4);
        expect(player1Stats.H).toBe(3);
        expect(player1Stats["1B"]).toBe(1);
        expect(player1Stats["2B"]).toBe(1);
        expect(player1Stats["3B"]).toBe(1);
        expect(player1Stats.RBI).toBe(3);
        expect(player1Stats.AVG).toBe(".750"); // 3/4
    });

    it("should handle walks correctly (not counting as at-bats)", () => {
        const logs = [
            { playerId: "player1", eventType: "walk", rbi: 0, baseState: "{}" },
            {
                playerId: "player1",
                eventType: "single",
                rbi: 1,
                baseState: "{}",
            },
            { playerId: "player1", eventType: "walk", rbi: 0, baseState: "{}" },
        ];

        const stats = calculateGameStats(logs, mockPlayerChart);
        const player1Stats = stats.find((s) => s.player.$id === "player1");

        expect(player1Stats.PA).toBe(3);
        expect(player1Stats.AB).toBe(1); // Walks don't count as ABs
        expect(player1Stats.BB).toBe(2);
        expect(player1Stats.H).toBe(1);
        expect(player1Stats.AVG).toBe("1.000"); // 1/1
    });

    it("should track strikeouts correctly", () => {
        const logs = [
            { playerId: "player1", eventType: "K", rbi: 0, baseState: "{}" },
            { playerId: "player1", eventType: "K", rbi: 0, baseState: "{}" },
            {
                playerId: "player1",
                eventType: "single",
                rbi: 0,
                baseState: "{}",
            },
        ];

        const stats = calculateGameStats(logs, mockPlayerChart);
        const player1Stats = stats.find((s) => s.player.$id === "player1");

        expect(player1Stats.K).toBe(2);
        expect(player1Stats.AB).toBe(3); // K counts as AB
        expect(player1Stats.H).toBe(1);
    });

    it("should calculate OBP correctly", () => {
        const logs = [
            {
                playerId: "player1",
                eventType: "single",
                rbi: 0,
                baseState: "{}",
            },
            { playerId: "player1", eventType: "walk", rbi: 0, baseState: "{}" },
            { playerId: "player1", eventType: "out", rbi: 0, baseState: "{}" },
            {
                playerId: "player1",
                eventType: "double",
                rbi: 1,
                baseState: "{}",
            },
        ];

        const stats = calculateGameStats(logs, mockPlayerChart);
        const player1Stats = stats.find((s) => s.player.$id === "player1");

        // OBP = (H + BB) / (AB + BB) = (2 + 1) / (3 + 1) = 3/4 = .750
        expect(player1Stats.OBP).toBe(".750");
    });

    it("should calculate SLG correctly", () => {
        const logs = [
            {
                playerId: "player1",
                eventType: "single",
                rbi: 0,
                baseState: "{}",
            },
            {
                playerId: "player1",
                eventType: "double",
                rbi: 0,
                baseState: "{}",
            },
            {
                playerId: "player1",
                eventType: "homerun",
                rbi: 1,
                baseState: "{}",
            },
            { playerId: "player1", eventType: "out", rbi: 0, baseState: "{}" },
        ];

        const stats = calculateGameStats(logs, mockPlayerChart);
        const player1Stats = stats.find((s) => s.player.$id === "player1");

        // Total Bases = 1 + 2 + 4 = 7
        // SLG = 7 / 4 = 1.750
        expect(player1Stats.SLG).toBe("1.750");
    });

    it("should calculate OPS correctly", () => {
        const logs = [
            {
                playerId: "player1",
                eventType: "single",
                rbi: 0,
                baseState: "{}",
            },
            {
                playerId: "player1",
                eventType: "double",
                rbi: 0,
                baseState: "{}",
            },
            { playerId: "player1", eventType: "walk", rbi: 0, baseState: "{}" },
            { playerId: "player1", eventType: "out", rbi: 0, baseState: "{}" },
        ];

        const stats = calculateGameStats(logs, mockPlayerChart);
        const player1Stats = stats.find((s) => s.player.$id === "player1");

        // OBP = (2 + 1) / (3 + 1) = .750
        // SLG = (1 + 2) / 3 = 1.000
        // OPS = .750 + 1.000 = 1.750
        expect(player1Stats.OPS).toBe("1.750");
    });

    it("should credit runs to players who scored", () => {
        const logs = [
            {
                playerId: "player1",
                eventType: "homerun",
                rbi: 2,
                baseState: JSON.stringify({ scored: ["player1", "player2"] }),
            },
        ];

        const stats = calculateGameStats(logs, mockPlayerChart);
        const player1Stats = stats.find((s) => s.player.$id === "player1");
        const player2Stats = stats.find((s) => s.player.$id === "player2");

        expect(player1Stats.R).toBe(1);
        expect(player1Stats.RBI).toBe(2);
        expect(player2Stats.R).toBe(1);
    });

    it("should handle baseState as string or object", () => {
        const logs = [
            {
                playerId: "player1",
                eventType: "double",
                rbi: 1,
                baseState: JSON.stringify({ scored: ["player2"] }),
            },
            {
                playerId: "player1",
                eventType: "single",
                rbi: 0,
                baseState: { scored: [] },
            },
        ];

        const stats = calculateGameStats(logs, mockPlayerChart);
        const player2Stats = stats.find((s) => s.player.$id === "player2");

        expect(player2Stats.R).toBe(1);
    });

    it("should handle errors and fielders choice as at-bats", () => {
        const logs = [
            {
                playerId: "player1",
                eventType: "error",
                rbi: 0,
                baseState: "{}",
            },
            {
                playerId: "player1",
                eventType: "fielders_choice",
                rbi: 0,
                baseState: "{}",
            },
        ];

        const stats = calculateGameStats(logs, mockPlayerChart);
        const player1Stats = stats.find((s) => s.player.$id === "player1");

        expect(player1Stats.PA).toBe(2);
        expect(player1Stats.AB).toBe(2);
        expect(player1Stats.H).toBe(0);
    });

    it("should handle UI key event types and standardize them", () => {
        const logs = [
            { playerId: "player1", eventType: "1B", rbi: 0, baseState: "{}" },
            { playerId: "player1", eventType: "2B", rbi: 0, baseState: "{}" },
            { playerId: "player1", eventType: "HR", rbi: 1, baseState: "{}" },
        ];

        const stats = calculateGameStats(logs, mockPlayerChart);
        const player1Stats = stats.find((s) => s.player.$id === "player1");

        expect(player1Stats.H).toBe(3);
        expect(player1Stats["1B"]).toBe(1);
        expect(player1Stats["2B"]).toBe(1);
        expect(player1Stats.HR).toBe(1);
    });

    it("should skip logs for players not in the chart", () => {
        const logs = [
            {
                playerId: "unknownPlayer",
                eventType: "single",
                rbi: 0,
                baseState: "{}",
            },
            {
                playerId: "player1",
                eventType: "double",
                rbi: 0,
                baseState: "{}",
            },
        ];

        const stats = calculateGameStats(logs, mockPlayerChart);

        expect(stats).toHaveLength(3);
        expect(stats.find((s) => s.player.$id === "player1").H).toBe(1);
    });

    it("should format stats correctly with leading zero removal", () => {
        const logs = [
            {
                playerId: "player1",
                eventType: "single",
                rbi: 0,
                baseState: "{}",
            },
            { playerId: "player1", eventType: "out", rbi: 0, baseState: "{}" },
            { playerId: "player1", eventType: "out", rbi: 0, baseState: "{}" },
        ];

        const stats = calculateGameStats(logs, mockPlayerChart);
        const player1Stats = stats.find((s) => s.player.$id === "player1");

        // AVG = 1/3 = .333...
        expect(player1Stats.AVG).toBe(".333");
    });

    it("should handle perfect 1.000 batting average correctly", () => {
        const logs = [
            {
                playerId: "player1",
                eventType: "single",
                rbi: 0,
                baseState: "{}",
            },
            {
                playerId: "player1",
                eventType: "double",
                rbi: 0,
                baseState: "{}",
            },
            {
                playerId: "player1",
                eventType: "homerun",
                rbi: 1,
                baseState: "{}",
            },
        ];

        const stats = calculateGameStats(logs, mockPlayerChart);
        const player1Stats = stats.find((s) => s.player.$id === "player1");

        expect(player1Stats.AVG).toBe("1.000");
    });

    it("should handle invalid baseState JSON gracefully", () => {
        const logs = [
            {
                playerId: "player1",
                eventType: "single",
                rbi: 0,
                baseState: "invalid-json",
            },
        ];

        // Should not throw
        expect(() => calculateGameStats(logs, mockPlayerChart)).not.toThrow();
    });

    it("should calculate OBP correctly with sacrifice flies", () => {
        const logs = [
            {
                playerId: "player1",
                eventType: "single", // H:1, AB:1, PA:1
                rbi: 0,
            },
            {
                playerId: "player1",
                eventType: "BB", // BB:1, AB:1, PA:2
                rbi: 0,
            },
            {
                playerId: "player1",
                eventType: "sacrifice_fly", // SF:1, AB:1, PA:3
                rbi: 1,
            },
            {
                playerId: "player1",
                eventType: "out", // AB:2, PA:4
                rbi: 0,
            },
        ];
        // AB: 2, H: 1, BB: 1, SF: 1
        // AVG: 1 / 2 = .500
        // OBP: (1 + 1) / (2 + 1 + 1) = 2 / 4 = .500
        const result = calculateGameStats(logs, mockPlayerChart);
        expect(result[0].AB).toBe(2);
        expect(result[0].PA).toBe(4);
        expect(result[0].SF).toBe(1);
        expect(result[0].AVG).toBe(".500");
        expect(result[0].OBP).toBe(".500");
    });
});

describe("calculateTeamTotals", () => {
    it("should sum all player stats correctly", () => {
        const statsArray = [
            {
                player: { $id: "p1" },
                PA: 4,
                AB: 4,
                H: 2,
                R: 1,
                RBI: 2,
                BB: 0,
                K: 1,
                "1B": 1,
                "2B": 1,
                "3B": 0,
                HR: 0,
            },
            {
                player: { $id: "p2" },
                PA: 3,
                AB: 2,
                H: 1,
                R: 0,
                RBI: 0,
                BB: 1,
                K: 0,
                "1B": 1,
                "2B": 0,
                "3B": 0,
                HR: 0,
            },
        ];

        const totals = calculateTeamTotals(statsArray);

        expect(totals.player.firstName).toBe("TEAM");
        expect(totals.player.lastName).toBe("TOTALS");
        expect(totals.PA).toBe(7);
        expect(totals.AB).toBe(6);
        expect(totals.H).toBe(3);
        expect(totals.R).toBe(1);
        expect(totals.RBI).toBe(2);
        expect(totals.BB).toBe(1);
        expect(totals.K).toBe(1);
        expect(totals["1B"]).toBe(2);
        expect(totals["2B"]).toBe(1);
    });

    it("should calculate team batting average correctly", () => {
        const statsArray = [
            {
                player: { $id: "p1" },
                PA: 4,
                AB: 4,
                H: 2,
                R: 0,
                RBI: 0,
                BB: 0,
                K: 0,
                "1B": 2,
                "2B": 0,
                "3B": 0,
                HR: 0,
            },
            {
                player: { $id: "p2" },
                PA: 4,
                AB: 4,
                H: 2,
                R: 0,
                RBI: 0,
                BB: 0,
                K: 0,
                "1B": 2,
                "2B": 0,
                "3B": 0,
                HR: 0,
            },
        ];

        const totals = calculateTeamTotals(statsArray);

        // Team AVG = 4/8 = .500
        expect(totals.AVG).toBe(".500");
    });

    it("should calculate team OBP correctly", () => {
        const statsArray = [
            {
                player: { $id: "p1" },
                PA: 3,
                AB: 2,
                H: 1,
                R: 0,
                RBI: 0,
                BB: 1,
                K: 0,
                "1B": 1,
                "2B": 0,
                "3B": 0,
                HR: 0,
            },
        ];

        const totals = calculateTeamTotals(statsArray);

        // OBP = (H + BB) / (AB + BB) = (1 + 1) / (2 + 1) = 2/3 = .667
        expect(totals.OBP).toBe(".667");
    });

    it("should calculate team SLG correctly", () => {
        const statsArray = [
            {
                player: { $id: "p1" },
                PA: 4,
                AB: 4,
                H: 3,
                R: 0,
                RBI: 0,
                BB: 0,
                K: 0,
                "1B": 1,
                "2B": 1,
                "3B": 0,
                HR: 1,
            },
        ];

        const totals = calculateTeamTotals(statsArray);

        // Total Bases = 1 + 2 + 4 = 7
        // SLG = 7/4 = 1.750
        expect(totals.SLG).toBe("1.750");
    });

    it("should calculate team OPS correctly", () => {
        const statsArray = [
            {
                player: { $id: "p1" },
                PA: 4,
                AB: 4,
                H: 2,
                R: 0,
                RBI: 0,
                BB: 0,
                K: 0,
                "1B": 2,
                "2B": 0,
                "3B": 0,
                HR: 0,
            },
        ];

        const totals = calculateTeamTotals(statsArray);

        // OBP = 2/4 = .500
        // SLG = 2/4 = .500
        // OPS = 1.000
        expect(totals.OPS).toBe("1.000");
    });

    it("should return .000 for stats when no at-bats", () => {
        const statsArray = [
            {
                player: { $id: "p1" },
                PA: 2,
                AB: 0,
                H: 0,
                R: 0,
                RBI: 0,
                BB: 2,
                K: 0,
                "1B": 0,
                "2B": 0,
                "3B": 0,
                HR: 0,
            },
        ];

        const totals = calculateTeamTotals(statsArray);

        expect(totals.AVG).toBe(".000");
        expect(totals.SLG).toBe(".000");
    });

    it("should handle empty stats array", () => {
        const totals = calculateTeamTotals([]);

        expect(totals.AB).toBe(0);
        expect(totals.H).toBe(0);
        expect(totals.AVG).toBe(".000");
        expect(totals.OBP).toBe(".000");
        expect(totals.SLG).toBe(".000");
        expect(totals.OPS).toBe(".000");
    });

    it("should format perfect 1.000 team average correctly", () => {
        const statsArray = [
            {
                player: { $id: "p1" },
                PA: 3,
                AB: 3,
                H: 3,
                R: 0,
                RBI: 0,
                BB: 0,
                K: 0,
                "1B": 3,
                "2B": 0,
                "3B": 0,
                HR: 0,
            },
        ];

        const totals = calculateTeamTotals(statsArray);

        expect(totals.AVG).toBe("1.000");
    });
});

describe("calculatePlayerStats", () => {
    it("should initialize with zero stats for empty logs", () => {
        const stats = calculatePlayerStats([]);
        expect(stats.hits).toBe(0);
        expect(stats.ab).toBe(0);
        expect(stats.rbi).toBe(0);
        expect(stats.calculated.avg).toBe(".000");
    });

    it("should correctly calculate basic batting stats", () => {
        const logs = [
            { eventType: "single", rbi: 0 },
            { eventType: "double", rbi: 1 },
            { eventType: "out", rbi: 0 },
            { eventType: "triple", rbi: 2 },
        ];

        const stats = calculatePlayerStats(logs);

        expect(stats.ab).toBe(4);
        expect(stats.hits).toBe(3); // 1B, 2B, 3B
        expect(stats.rbi).toBe(3);
        expect(stats.details["1B"]).toBe(1);
        expect(stats.details["2B"]).toBe(1);
        expect(stats.details["3B"]).toBe(1);
        expect(stats.calculated.avg).toBe(".750"); // 3/4
    });

    it("should handle walks and sac flies correctly for OBP", () => {
        const logs = [
            { eventType: "single", rbi: 0 },
            { eventType: "walk", rbi: 0 },
            { eventType: "sacrifice_fly", rbi: 1 },
            { eventType: "out", rbi: 0 },
        ];
        // AB: 2 (single, out), H: 1
        // BB: 1, SF: 1
        // AVG: 1 / 2 = .500
        // OBP: (1 + 1) / (2 + 1 + 1) = 2 / 4 = .500

        const stats = calculatePlayerStats(logs);

        expect(stats.ab).toBe(2);
        expect(stats.hits).toBe(1);
        expect(stats.details.BB).toBe(1);
        expect(stats.details.SF).toBe(1);
        expect(stats.calculated.avg).toBe(".500");
        expect(stats.calculated.obp).toBe(".500");
    });

    it("should calculate SLG and OPS correctly", () => {
        const logs = [
            { eventType: "single", rbi: 0 }, // 1 base
            { eventType: "double", rbi: 0 }, // 2 bases
            { eventType: "homerun", rbi: 1 }, // 4 bases
            { eventType: "out", rbi: 0 }, // 0 bases
        ];
        // AB: 4
        // Total Bases: 1 + 2 + 4 = 7
        // SLG: 7 / 4 = 1.750
        // OBP: 3 / 4 = .750
        // OPS: 1.750 + .750 = 2.500

        const stats = calculatePlayerStats(logs);

        expect(stats.calculated.slg).toBe("1.750");
        expect(stats.calculated.obp).toBe(".750");
        expect(stats.calculated.ops).toBe("2.500");
    });

    it("should handle UI key event types and standardize them", () => {
        const logs = [
            { eventType: "1B", rbi: 0 },
            { eventType: "2B", rbi: 0 },
            { eventType: "3B", rbi: 0 },
            { eventType: "HR", rbi: 1 },
            { eventType: "K", rbi: 0 },
            { eventType: "BB", rbi: 0 },
            { eventType: "SF", rbi: 1 },
        ];
        // 1B, 2B, 3B, HR = single, double, triple, homerun (4 hits, 4 AB)
        // K = out (1 AB, 1 out, 1 K)
        // BB = walk (0 AB, 1 BB)
        // SF = sacrifice_fly (0 AB, 1 SF)
        // Total: AB: 5, Hits: 4, BB: 1, SF: 1, RBI: 2, K: 1

        const stats = calculatePlayerStats(logs);

        expect(stats.ab).toBe(5);
        expect(stats.hits).toBe(4);
        expect(stats.details.BB).toBe(1);
        expect(stats.details.SF).toBe(1);
        expect(stats.details.K).toBe(1);
        expect(stats.rbi).toBe(2);
        // AVG = 4 / 5 = .800
        expect(stats.calculated.avg).toBe(".800");
    });

    it("should handle new granular out types correctly", () => {
        const outTypes = [
            "strikeout",
            "ground_out",
            "fly_out",
            "line_out",
            "pop_out",
        ];
        const logs = outTypes.map((type) => ({ eventType: type }));

        const stats = calculatePlayerStats(logs);

        expect(stats.ab).toBe(5);
        expect(stats.details.Outs).toBe(5);
        expect(stats.details.K).toBe(1); // Only strikeout
    });

    it("should handle error and fielders_choice database values", () => {
        const logs = [
            { eventType: "error" },
            { eventType: "fielders_choice" },
        ];

        const stats = calculatePlayerStats(logs);

        expect(stats.ab).toBe(2);
        expect(stats.details.E).toBe(1);
        expect(stats.details.FC).toBe(1);
    });
});
