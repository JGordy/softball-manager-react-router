import { validateLineup } from "./validateLineup";

describe("validateLineup", () => {
    const mockPlayers = [
        {
            $id: "1",
            firstName: "M1",
            lastName: "P",
            gender: "Male",
            positions: ["Pitcher", "Catcher"],
        },
        {
            $id: "2",
            firstName: "M2",
            lastName: "P",
            gender: "Male",
            positions: ["Catcher", "Pitcher"],
        },
        {
            $id: "3",
            firstName: "M3",
            lastName: "P",
            gender: "Male",
            positions: ["First Base", "Second Base"],
        },
        {
            $id: "4",
            firstName: "M4",
            lastName: "P",
            gender: "Male",
            positions: ["Second Base", "First Base"],
        },
        {
            $id: "5",
            firstName: "F1",
            lastName: "P",
            gender: "Female",
            positions: ["Third Base", "Shortstop"],
        },
    ];

    it("should detect batting order errors (max 3 consecutive males)", () => {
        const lineup = [...mockPlayers]; // 4 males then 1 female
        const team = { genderMix: "Coed" };
        const { battingErrors } = validateLineup(lineup, team);

        expect(battingErrors).toHaveLength(1);
        expect(battingErrors[0].playerId).toBe("4");
        expect(battingErrors[0].message).toContain(
            "More than 3 consecutive male batters (4 in a row)",
        );
    });

    it("should not detect batting order errors if rule is followed", () => {
        const lineup = [
            mockPlayers[0],
            mockPlayers[1],
            mockPlayers[2],
            mockPlayers[4], // Female
            mockPlayers[3], // Male
        ];
        const { battingErrors } = validateLineup(lineup);
        expect(battingErrors).toHaveLength(0);
    });

    it("should detect duplicate fielding positions", () => {
        const lineup = [
            { $id: "1", firstName: "A", lastName: "B", positions: ["Pitcher"] },
            { $id: "2", firstName: "C", lastName: "D", positions: ["Pitcher"] },
        ];
        const { fieldingErrors } = validateLineup(lineup);

        expect(fieldingErrors.inning1.duplicates).toHaveLength(1);
        expect(fieldingErrors.inning1.duplicates[0].position).toBe("Pitcher");
        expect(fieldingErrors.inning1.duplicates[0].players).toEqual([
            "1",
            "2",
        ]);
    });

    it("should detect missing fielding positions", () => {
        const lineup = [
            { $id: "1", firstName: "A", lastName: "B", positions: ["Pitcher"] },
        ];
        const { fieldingErrors } = validateLineup(lineup);

        // Should be missing everything else
        expect(fieldingErrors.inning1.missing).toContain("Catcher");
        expect(fieldingErrors.inning1.missing).not.toContain("Pitcher");
    });

    it("should generate summary messages", () => {
        const lineup = [...mockPlayers]; // 4 males
        const team = { genderMix: "Coed" };
        const { summary } = validateLineup(lineup, team);

        expect(
            summary.some((s) => s.includes("4th consecutive male batter")),
        ).toBe(true);
    });
});
