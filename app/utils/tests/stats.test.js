import {
    calculateGameStats,
    calculateTeamTotals,
    calculatePlayerStats,
    calculateSeasonRadarMetrics,
    calculatePlayerRadarMetrics,
    calculatePlatformBenchmarks,
    applyLogToAggregate,
    applyLogToPlatformBenchmark,
    PLAYER_PLATFORM_BENCHMARKS,
} from "../stats";

describe("calculateGameStats", () => {
    const mockPlayerChart = [
        {
            $id: "player1",
            firstName: "John",
            lastName: "Doe",
            jerseyNumber: "10",
        },
        {
            $id: "player2",
            firstName: "Jane",
            lastName: "Smith",
            jerseyNumber: "22",
        },
        { $id: "player3", firstName: "Bob", lastName: "Jones" },
    ];

    it("should initialize stats for all players in lineup with zero values and preserve jerseyNumber", () => {
        const stats = calculateGameStats([], mockPlayerChart);

        expect(stats).toHaveLength(3);
        expect(stats[0].player.jerseyNumber).toBe("10");
        expect(stats[1].player.jerseyNumber).toBe("22");
        expect(stats[2].player.jerseyNumber).toBeUndefined();

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

    it("should initialize stats for substitutes by tracking the substitutions array and preserve jerseyNumber", () => {
        const mockPlayerChartWithSub = [
            {
                $id: "player1",
                firstName: "John",
                lastName: "Doe",
                jerseyNumber: "10",
                substitutions: [
                    {
                        playerId: "sub1",
                        firstName: "Bench",
                        lastName: "Guy",
                        jerseyNumber: "99",
                    },
                ],
            },
        ];
        const stats = calculateGameStats([], mockPlayerChartWithSub);

        expect(stats).toHaveLength(2);
        expect(stats[0].player.$id).toBe("player1");
        expect(stats[0].player.jerseyNumber).toBe("10");
        expect(stats[1].player.$id).toBe("sub1");
        expect(stats[1].player.firstName).toBe("Bench");
        expect(stats[1].player.jerseyNumber).toBe("99");
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

    it("should skip SUB event types entirely and not increment at-bats or plate appearances", () => {
        const mockPlayerChartLocal = [{ $id: "player1" }];
        const logs = [
            { playerId: "player1", eventType: "SUB", rbi: 0, baseState: "{}" },
            {
                playerId: "player1",
                eventType: "single",
                rbi: 0,
                baseState: "{}",
            },
        ];
        const stats = calculateGameStats(logs, mockPlayerChartLocal);
        const player1Stats = stats.find((s) => s.player.$id === "player1");
        expect(player1Stats.PA).toBe(1);
        expect(player1Stats.AB).toBe(1);
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

    it("should skip opponent run and play events entirely when isOpponent is false", () => {
        const logs = [
            {
                playerId: "player1",
                eventType: "single",
                rbi: 0,
                baseState: "{}",
            },
            {
                playerId: "player1",
                eventType: "opponent_run",
                rbi: 3,
                baseState: JSON.stringify({ isOpponent: true }),
            },
        ];
        const stats = calculateGameStats(logs, mockPlayerChart, false);
        const player1Stats = stats.find((s) => s.player.$id === "player1");
        expect(player1Stats.PA).toBe(1);
        expect(player1Stats.AB).toBe(1);
        expect(player1Stats.H).toBe(1);
        expect(player1Stats.RBI).toBe(0);
    });

    it("should calculate opponent stats and skip our team's plays when isOpponent is true", () => {
        const mockOpponentChart = [
            {
                $id: "OPP_BAT_1",
                firstName: "Opponent",
                lastName: "One",
            },
        ];
        const logs = [
            {
                playerId: "player1",
                eventType: "single",
                rbi: 0,
                baseState: "{}",
            },
            {
                playerId: "OPP_BAT_1",
                eventType: "double",
                rbi: 2,
                baseState: JSON.stringify({ isOpponent: true }),
            },
        ];
        // For opponent, it should ignore player1's single (our play) and only calculate the double for OPP_BAT_1
        const stats = calculateGameStats(logs, mockOpponentChart, true, true);
        const oppStats = stats.find((s) => s.player.$id === "OPP_BAT_1");
        expect(oppStats.PA).toBe(1);
        expect(oppStats.AB).toBe(1);
        expect(oppStats.H).toBe(1);
        expect(oppStats["2B"]).toBe(1);
        expect(oppStats.RBI).toBe(2);
    });

    it("should skip injury_auto_out and INJURY_REMOVE event types entirely and not increment at-bats or plate appearances", () => {
        const logs = [
            {
                playerId: "player1",
                eventType: "injury_auto_out",
                rbi: 0,
                baseState: "{}",
            },
            {
                playerId: "player1",
                eventType: "INJURY_REMOVE",
                rbi: 0,
                baseState: "{}",
            },
            {
                playerId: "player1",
                eventType: "single",
                rbi: 0,
                baseState: "{}",
            },
        ];
        const stats = calculateGameStats(logs, mockPlayerChart);
        const player1Stats = stats.find((s) => s.player.$id === "player1");
        expect(player1Stats.PA).toBe(1);
        expect(player1Stats.AB).toBe(1);
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
        const stats = calculatePlayerStats([], "player1");
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

        const mappedLogs = logs.map((l) => ({ ...l, playerId: "player1" }));
        const stats = calculatePlayerStats(mappedLogs, "player1");

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

        const mappedLogs = logs.map((l) => ({ ...l, playerId: "player1" }));
        const stats = calculatePlayerStats(mappedLogs, "player1");

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

        const mappedLogs = logs.map((l) => ({ ...l, playerId: "player1" }));
        const stats = calculatePlayerStats(mappedLogs, "player1");

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

        const mappedLogs = logs.map((l) => ({ ...l, playerId: "player1" }));
        const stats = calculatePlayerStats(mappedLogs, "player1");

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

        const mappedLogs = logs.map((l) => ({ ...l, playerId: "player1" }));
        const stats = calculatePlayerStats(mappedLogs, "player1");

        expect(stats.ab).toBe(5);
        expect(stats.details.Outs).toBe(5);
        expect(stats.details.K).toBe(1); // Only strikeout
    });

    it("should handle error and fielders_choice database values", () => {
        const logs = [{ eventType: "error" }, { eventType: "fielders_choice" }];

        const mappedLogs = logs.map((l) => ({ ...l, playerId: "player1" }));
        const stats = calculatePlayerStats(mappedLogs, "player1");

        expect(stats.ab).toBe(2);
        expect(stats.details.E).toBe(1);
        expect(stats.details.FC).toBe(1);
    });

    it("should skip opponent run and play events entirely", () => {
        const logs = [
            { eventType: "single", rbi: 0 },
            {
                eventType: "opponent_run",
                rbi: 2,
                baseState: { isOpponent: true },
            },
        ];
        const mappedLogs = logs.map((l) => ({ ...l, playerId: "player1" }));
        const stats = calculatePlayerStats(mappedLogs, "player1");
        expect(stats.ab).toBe(1);
        expect(stats.hits).toBe(1);
        expect(stats.rbi).toBe(0);
    });

    it("should correctly credit runs to players but not add plate appearances if they only scored", () => {
        const logs = [
            // Opponent play where player1 scored (not batter)
            {
                playerId: "player2",
                eventType: "single",
                rbi: 1,
                baseState: JSON.stringify({ scored: ["player1"] }),
            },
            // Player1's own at-bat where they also scored
            {
                playerId: "player1",
                eventType: "single",
                rbi: 0,
                scored: ["player1"],
            },
        ];
        const stats = calculatePlayerStats(logs, "player1");
        expect(stats.ab).toBe(1);
        expect(stats.hits).toBe(1);
        expect(stats.runs).toBe(2);
    });

    it("should skip injury_auto_out and INJURY_REMOVE events", () => {
        const logs = [
            { eventType: "single", rbi: 0 },
            { eventType: "injury_auto_out", rbi: 0 },
            { eventType: "INJURY_REMOVE", rbi: 0 },
        ];
        const mappedLogs = logs.map((l) => ({ ...l, playerId: "player1" }));
        const stats = calculatePlayerStats(mappedLogs, "player1");
        expect(stats.ab).toBe(1);
        expect(stats.hits).toBe(1);
    });
});

describe("calculateSeasonRadarMetrics", () => {
    it("should calculate normalized scores and raw metrics correctly", () => {
        const games = [
            { score: 14, opponentScore: 6, result: "W" },
            { score: 10, opponentScore: 8, result: "W" },
        ];
        const totals = {
            H: 30,
            AVG: ".500",
            SLG: ".800",
        };

        const metrics = calculateSeasonRadarMetrics({ games, totals });

        expect(metrics.gamesPlayed).toBe(2);
        expect(metrics.raw.RPG).toBe(12);
        expect(metrics.raw.RAPG).toBe(7);
        expect(metrics.raw.HPG).toBe(15);
        expect(metrics.raw.AVG).toBe(".500");
        expect(metrics.raw.SLG).toBe(".800");

        // Fixed scores (0-100 scale)
        // RPG: 12 / 20 * 100 = 60
        expect(metrics.fixedScores.RPG).toBe(60);
        // HPG: 15 / 25 * 100 = 60
        expect(metrics.fixedScores.HPG).toBe(60);
        // AVG: .500 / .700 * 100 = 71
        expect(metrics.fixedScores.AVG).toBe(71);
        // SLG: .800 / 1.200 * 100 = 67
        expect(metrics.fixedScores.SLG).toBe(67);
    });

    it("should handle empty games and totals gracefully", () => {
        const metrics = calculateSeasonRadarMetrics({});
        expect(metrics.gamesPlayed).toBe(0);
        expect(metrics.raw.RPG).toBe(0);
        expect(metrics.raw.AVG).toBe(".000");
        expect(metrics.fixedScores.RPG).toBe(0);
    });

    it("should filter out legacy unlogged games when calculating Hits per Game", () => {
        const games = [
            { $id: "g1", score: 10, opponentScore: 5 },
            { $id: "g2", score: 8, opponentScore: 6 },
            { $id: "g3", score: 12, opponentScore: 4 },
        ];
        const logs = [
            { gameId: "g1", eventType: "single" },
            { gameId: "g2", eventType: "double" },
        ];
        const totals = { H: 20, AVG: ".500", SLG: ".750" };

        const metrics = calculateSeasonRadarMetrics({ games, totals, logs });

        expect(metrics.gamesPlayed).toBe(3);
        expect(metrics.loggedGamesCount).toBe(2);
        expect(metrics.hasLegacyUnloggedGames).toBe(true);
        expect(metrics.raw.HPG).toBe(10);
    });

    it("should include platform benchmark defaults", () => {
        expect(PLAYER_PLATFORM_BENCHMARKS).toBeDefined();
        expect(PLAYER_PLATFORM_BENCHMARKS.RPG).toBeGreaterThan(0);
    });
});

describe("calculatePlayerRadarMetrics", () => {
    const mockOverallStats = {
        hits: 30,
        ab: 41,
        rbi: 25,
        runs: 20,
        calculated: {
            avg: ".732",
            slg: "1.268",
            ops: "1.995",
        },
    };

    it("should calculate raw per-game metrics and 0-100 radar scores correctly", () => {
        const result = calculatePlayerRadarMetrics({
            overallStats: mockOverallStats,
            gameCountWithLogs: 10,
        });

        expect(result.gameCountWithLogs).toBe(10);
        expect(result.raw.HPG).toBe("3.00"); // 30 / 10
        expect(result.raw.RBIPG).toBe("2.50"); // 25 / 10
        expect(result.raw.RPG).toBe("2.00"); // 20 / 10
        expect(result.raw.AVG).toBe(".732");
        expect(result.raw.SLG).toBe("1.268");
        expect(result.raw.OPS).toBe("1.995");

        expect(result.radarData.length).toBe(6);
        const hpgItem = result.radarData.find((item) => item.metric === "HPG");
        expect(hpgItem.playerRaw).toBe("3.00");
        expect(hpgItem.playerScore).toBe(75); // (3.0 / 4.0) * 100
    });

    it("should handle empty or zero game count gracefully", () => {
        const result = calculatePlayerRadarMetrics({
            overallStats: null,
            gameCountWithLogs: 0,
        });

        expect(result.radarData).toEqual([]);
        expect(result.raw.HPG).toBe("0.00");
    });
});

describe("calculatePlatformBenchmarks", () => {
    it("should calculate dynamic benchmarks from platform game logs", () => {
        const mockLogs = [
            { playerId: "p1", gameId: "g1", eventType: "single", rbi: 1 },
            { playerId: "p1", gameId: "g1", eventType: "double", rbi: 2 },
            { playerId: "p1", gameId: "g2", eventType: "out", rbi: 0 },
            { playerId: "p1", gameId: "g2", eventType: "homerun", rbi: 3 },
        ];

        const benchmarks = calculatePlatformBenchmarks(mockLogs);

        expect(benchmarks.HPG).toBe(1.5); // 3 hits / 2 player-game appearances
        expect(benchmarks.RBIPG).toBe(3); // 6 rbi / 2 player-game appearances
        expect(benchmarks.AVG).toBe(0.75); // 3 hits / 4 ab
    });

    it("should return default benchmarks if logs array is empty", () => {
        const result = calculatePlatformBenchmarks([]);
        expect(result).toEqual(PLAYER_PLATFORM_BENCHMARKS);
    });
});

describe("applyLogToAggregate and applyLogToPlatformBenchmark", () => {
    it("should correctly increment user stats aggregate on +1 event and decrement on -1 undo", () => {
        const initial = { hits: 0, ab: 0, tb: 0, rbi: 0, gameCount: 5 };
        const singleLog = { playerId: "user1", eventType: "single", rbi: 1 };

        // +1 event
        const afterAdd = applyLogToAggregate(initial, singleLog, 1);
        expect(afterAdd.hits).toBe(1);
        expect(afterAdd.ab).toBe(1);
        expect(afterAdd.tb).toBe(1);
        expect(afterAdd.rbi).toBe(1);
        expect(afterAdd.avg).toBe(1.0);

        // -1 undo event
        const afterUndo = applyLogToAggregate(afterAdd, singleLog, -1);
        expect(afterUndo.hits).toBe(0);
        expect(afterUndo.ab).toBe(0);
        expect(afterUndo.tb).toBe(0);
        expect(afterUndo.rbi).toBe(0);
        expect(afterUndo.avg).toBe(0);
    });

    it("should correctly increment and decrement platform benchmarks on +1 and -1", () => {
        const initial = {
            totalHits: 10,
            totalAB: 20,
            totalTB: 30,
            totalRBIs: 15,
            totalRuns: 10,
            totalPlayerGames: 10,
        };
        const doubleLog = { playerId: "user1", eventType: "double", rbi: 2 };

        // +1 event
        const afterAdd = applyLogToPlatformBenchmark(initial, doubleLog, 1);
        expect(afterAdd.totalHits).toBe(11);
        expect(afterAdd.totalAB).toBe(21);
        expect(afterAdd.totalTB).toBe(32);
        expect(afterAdd.totalRBIs).toBe(17);

        // -1 undo event
        const afterUndo = applyLogToPlatformBenchmark(afterAdd, doubleLog, -1);
        expect(afterUndo.totalHits).toBe(10);
        expect(afterUndo.totalAB).toBe(20);
        expect(afterUndo.totalTB).toBe(30);
        expect(afterUndo.totalRBIs).toBe(15);
    });
});
