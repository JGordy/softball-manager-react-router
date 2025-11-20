import sortTeams from "./sortTeamsBySeason";
import { Settings } from "luxon";

describe("sortTeamsBySeason utility", () => {
    const originalNow = Settings.now;

    beforeAll(() => {
        // Mock "now" to be 2023-10-27T12:00:00Z
        Settings.now = () => new Date("2023-10-27T12:00:00Z").valueOf();
    });

    afterAll(() => {
        Settings.now = originalNow;
    });

    const teams = [
        {
            id: "current",
            name: "Current Team",
            seasons: [
                {
                    startDate: "2023-10-01T00:00:00Z",
                    endDate: "2023-11-01T00:00:00Z",
                },
            ],
        },
        {
            id: "upcoming",
            name: "Upcoming Team",
            seasons: [
                {
                    startDate: "2023-11-01T00:00:00Z",
                    endDate: "2023-12-01T00:00:00Z",
                },
            ],
        },
        {
            id: "past-recent",
            name: "Past Recent Team",
            seasons: [
                {
                    startDate: "2023-09-01T00:00:00Z",
                    endDate: "2023-10-01T00:00:00Z",
                },
            ],
        },
        {
            id: "past-old",
            name: "Past Old Team",
            seasons: [
                {
                    startDate: "2022-01-01T00:00:00Z",
                    endDate: "2022-02-01T00:00:00Z",
                },
            ],
        },
        {
            id: "none",
            name: "No Season Team",
            seasons: [],
        },
    ];

    it("should sort teams correctly", () => {
        // Expected order:
        // 1. Current
        // 2. Upcoming (earliest first)
        // 3. Past (most recent first)
        // 4. None (alphabetical)

        // Let's shuffle the teams first
        const shuffled = [...teams].sort(() => Math.random() - 0.5);
        const sorted = shuffled.sort(sortTeams);

        expect(sorted[0].id).toBe("current");
        expect(sorted[1].id).toBe("upcoming");
        expect(sorted[2].id).toBe("past-recent");
        expect(sorted[3].id).toBe("past-old");
        expect(sorted[4].id).toBe("none");
    });

    it("should sort multiple upcoming teams by date ascending", () => {
        const upcomingTeams = [
            {
                id: "later",
                name: "Later",
                seasons: [{ startDate: "2023-12-01T00:00:00Z" }],
            },
            {
                id: "sooner",
                name: "Sooner",
                seasons: [{ startDate: "2023-11-01T00:00:00Z" }],
            },
        ];

        const sorted = upcomingTeams.sort(sortTeams);
        expect(sorted[0].id).toBe("sooner");
        expect(sorted[1].id).toBe("later");
    });

    it("should sort multiple past teams by end date descending", () => {
        const pastTeams = [
            {
                id: "older",
                name: "Older",
                seasons: [{ endDate: "2022-01-01T00:00:00Z" }],
            },
            {
                id: "newer",
                name: "Newer",
                seasons: [{ endDate: "2023-01-01T00:00:00Z" }],
            },
        ];

        const sorted = pastTeams.sort(sortTeams);
        expect(sorted[0].id).toBe("newer");
        expect(sorted[1].id).toBe("older");
    });

    it("should tie-break with name", () => {
        const noSeasonTeams = [
            { id: "b", name: "B Team", seasons: [] },
            { id: "a", name: "A Team", seasons: [] },
        ];

        const sorted = noSeasonTeams.sort(sortTeams);
        expect(sorted[0].id).toBe("a");
        expect(sorted[1].id).toBe("b");
    });
});
