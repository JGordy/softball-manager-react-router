import addPlayerAvailability from "../addPlayerAvailability";

describe("addPlayerAvailability utility", () => {
    const createPlayer = (id, overrides = {}) => ({
        $id: id,
        firstName: `Player${id}`,
        lastName: `Last${id}`,
        ...overrides,
    });

    const createResponse = (playerId, status) => ({
        playerId,
        status,
    });

    it("should add availability status to players based on responses", () => {
        const players = [
            createPlayer("1"),
            createPlayer("2"),
            createPlayer("3"),
        ];
        const responses = [
            createResponse("1", "accepted"),
            createResponse("2", "declined"),
        ];

        const result = addPlayerAvailability(responses, players);

        expect(result[0].availability).toBe("accepted");
        expect(result[1].availability).toBe("declined");
        expect(result[2].availability).toBe("unknown");
    });

    it('should return "unknown" for players without a response', () => {
        const players = [createPlayer("1")];
        const responses = [];

        const result = addPlayerAvailability(responses, players);

        expect(result[0].availability).toBe("unknown");
    });

    it('should return "unknown" when response has no status', () => {
        const players = [createPlayer("1")];
        const responses = [{ playerId: "1" }]; // No status field

        const result = addPlayerAvailability(responses, players);

        expect(result[0].availability).toBe("unknown");
    });

    it("should preserve all original player properties", () => {
        const players = [
            createPlayer("1", {
                email: "test@example.com",
                preferredPositions: ["Pitcher"],
            }),
        ];
        const responses = [createResponse("1", "accepted")];

        const result = addPlayerAvailability(responses, players);

        expect(result[0].$id).toBe("1");
        expect(result[0].firstName).toBe("Player1");
        expect(result[0].email).toBe("test@example.com");
        expect(result[0].preferredPositions).toEqual(["Pitcher"]);
        expect(result[0].availability).toBe("accepted");
    });

    it("should handle empty players array", () => {
        const result = addPlayerAvailability([], []);

        expect(result).toEqual([]);
    });

    it("should handle various status values", () => {
        const players = [
            createPlayer("1"),
            createPlayer("2"),
            createPlayer("3"),
        ];
        const responses = [
            createResponse("1", "tentative"),
            createResponse("2", "maybe"),
            createResponse("3", "pending"),
        ];

        const result = addPlayerAvailability(responses, players);

        expect(result[0].availability).toBe("tentative");
        expect(result[1].availability).toBe("maybe");
        expect(result[2].availability).toBe("pending");
    });

    it("should not mutate original players array", () => {
        const players = [createPlayer("1")];
        const responses = [createResponse("1", "accepted")];

        const result = addPlayerAvailability(responses, players);

        expect(players[0]).not.toHaveProperty("availability");
        expect(result[0]).toHaveProperty("availability");
    });
});
