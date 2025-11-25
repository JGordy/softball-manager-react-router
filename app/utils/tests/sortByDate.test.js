import sortByDate from "../sortByDate";

describe("sortByDate utility", () => {
    it("should sort array by date key ascending", () => {
        const data = [
            { id: 1, date: "2023-10-28T10:00:00Z" },
            { id: 2, date: "2023-10-26T10:00:00Z" },
            { id: 3, date: "2023-10-27T10:00:00Z" },
        ];

        const result = sortByDate(data, "date");

        expect(result).toHaveLength(3);
        expect(result[0].id).toBe(2); // Oct 26
        expect(result[1].id).toBe(3); // Oct 27
        expect(result[2].id).toBe(1); // Oct 28
    });

    it("should handle invalid input gracefully", () => {
        expect(sortByDate(null, "date")).toEqual([]);
        expect(sortByDate("not-an-array", "date")).toEqual([]);
    });

    it("should handle invalid dates", () => {
        const data = [
            { id: 1, date: "invalid-date" },
            { id: 2, date: "2023-10-26T10:00:00Z" },
        ];

        const result = sortByDate(data, "date");

        // Invalid dates should be sorted to the end (or handled as per implementation)
        // Implementation says: if !aValid return 1 (move a to end), if !bValid return -1 (move b to end)
        expect(result[0].id).toBe(2);
        expect(result[1].id).toBe(1);
    });

    it("should not mutate original array", () => {
        const data = [
            { id: 1, date: "2023-10-28T10:00:00Z" },
            { id: 2, date: "2023-10-26T10:00:00Z" },
        ];
        const original = [...data];

        sortByDate(data, "date");

        expect(data).toEqual(original);
    });
});
