export const mockContext = {
    get: jest.fn((ctx) => {
        if (
            ctx &&
            (ctx.name === "userContext" ||
                String(ctx).includes("userContext") ||
                ctx === "userContext")
        ) {
            return { $id: "user-123", email: "test@example.com" };
        }
        return {
            account: { get: jest.fn().mockResolvedValue({ $id: "user-123" }) },
            databases: {
                listDocuments: jest.fn(),
                createDocument: jest.fn(),
                updateDocument: jest.fn(),
            },
            teamsDB: {},
            gamesDB: {},
            playersDB: {},
            seasonsDB: {},
            gameLogsDB: {},
            usersDB: {},
            awardsDB: {},
        };
    }),
};
