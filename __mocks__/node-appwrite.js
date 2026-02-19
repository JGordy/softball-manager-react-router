// Mock for node-appwrite to avoid ESM issues
module.exports = {
    Client: jest.fn(),
    Account: jest.fn(),
    Databases: jest.fn(),
    TablesDB: jest.fn(),
    Messaging: jest.fn(),
    ID: {
        unique: jest.fn(() => "unique-id"),
    },
    Query: {
        equal: jest.fn(
            (field, value) =>
                `Query.equal("${field}", ${JSON.stringify(value)})`,
        ),
        limit: jest.fn((value) => `Query.limit(${value})`),
        orderDesc: jest.fn((field) => `Query.orderDesc("${field}")`),
        orderAsc: jest.fn((field) => `Query.orderAsc("${field}")`),
        cursorAfter: jest.fn((value) => `Query.cursorAfter("${value}")`),
        select: jest.fn(
            (attrs) => `select([${attrs.map((a) => `"${a}"`).join(", ")}])`,
        ),
    },
    Permission: {
        read: jest.fn((role) => `read("${role}")`),
        write: jest.fn((role) => `write("${role}")`),
        update: jest.fn((role) => `update("${role}")`),
        delete: jest.fn((role) => `delete("${role}")`),
    },
    Role: {
        any: jest.fn(() => "any"),
        users: jest.fn(() => "users"),
        user: jest.fn((userId) => `user:${userId}`),
        team: jest.fn((teamId, role) =>
            role ? `team:${teamId}/${role}` : `team:${teamId}`,
        ),
    },
};
