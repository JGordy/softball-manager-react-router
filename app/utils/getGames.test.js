import getGames from "./getGames";
import { Settings } from "luxon";

describe("getGames utility", () => {
    const originalNow = Settings.now;

    beforeAll(() => {
        // Mock "now" to be 2023-10-27T12:00:00Z
        Settings.now = () => new Date("2023-10-27T12:00:00Z").valueOf();
    });

    afterAll(() => {
        Settings.now = originalNow;
    });

    const mockTeams = [
        {
            $id: "team1",
            name: "Team 1",
            seasons: [
                {
                    location: "Park A",
                    games: [
                        {
                            $id: "game1",
                            gameDate: "2023-10-26T10:00:00Z", // Past
                            teamId: "team1",
                        },
                        {
                            $id: "game2",
                            gameDate: "2023-10-28T10:00:00Z", // Future
                            teamId: "team1",
                        },
                    ],
                },
            ],
        },
        {
            $id: "team2",
            name: "Team 2",
            seasons: [
                {
                    location: "Park B",
                    games: [
                        {
                            $id: "game3",
                            gameDate: "2023-10-27T15:00:00Z", // Future (later today)
                            teamId: "team2",
                        },
                    ],
                },
            ],
        },
    ];

    it("should return future and past games correctly", () => {
        const { futureGames, pastGames } = getGames({ teams: mockTeams });

        expect(futureGames).toHaveLength(2);
        expect(pastGames).toHaveLength(1);

        // Check sorting
        // Future games: game3 (Oct 27 15:00) should be before game2 (Oct 28)
        expect(futureGames[0].$id).toBe("game3");
        expect(futureGames[1].$id).toBe("game2");

        // Past games: game1
        expect(pastGames[0].$id).toBe("game1");
    });

    it("should filter by teamId", () => {
        const { futureGames, pastGames } = getGames({
            teams: mockTeams,
            teamId: "team1",
        });

        expect(futureGames).toHaveLength(1); // Only game2
        expect(pastGames).toHaveLength(1); // Only game1
        expect(futureGames[0].$id).toBe("game2");
    });

    it("should add team name and location to games", () => {
        const { futureGames } = getGames({ teams: mockTeams });
        const game3 = futureGames.find((g) => g.$id === "game3");

        expect(game3.teamName).toBe("Team 2");
        expect(game3.location).toBe("Park B");
    });

    it("should handle missing seasons or games gracefully", () => {
        const teamsWithMissingData = [
            {
                $id: "team3",
                name: "Team 3",
                // No seasons
            },
            {
                $id: "team4",
                name: "Team 4",
                seasons: [
                    {
                        // No games
                        games: [],
                    },
                ],
            },
        ];

        const { futureGames, pastGames } = getGames({
            teams: teamsWithMissingData,
        });
        expect(futureGames).toHaveLength(0);
        expect(pastGames).toHaveLength(0);
    });

    it("should handle invalid dates gracefully", () => {
        const teamsWithInvalidDate = [
            {
                $id: "team5",
                name: "Team 5",
                seasons: [
                    {
                        games: [
                            {
                                $id: "gameBad",
                                gameDate: "invalid-date",
                                teamId: "team5",
                            },
                        ],
                    },
                ],
            },
        ];

        const consoleErrorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

        const { futureGames, pastGames } = getGames({
            teams: teamsWithInvalidDate,
        });

        expect(futureGames).toHaveLength(0);
        expect(pastGames).toHaveLength(0);
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });
});
