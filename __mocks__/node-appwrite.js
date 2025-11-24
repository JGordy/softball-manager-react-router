// Mock for node-appwrite to avoid ESM issues
module.exports = {
    Client: jest.fn(),
    Account: jest.fn(),
    Databases: jest.fn(),
    TablesDB: jest.fn(),
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
    },
    Permission: {
        read: jest.fn((role) => `read("${role}")`),
        write: jest.fn((role) => `write("${role}")`),
    },
    Role: {
        any: jest.fn(() => "any"),
        user: jest.fn((id) => `user:${id}`),
        team: jest.fn((id) => `team:${id}`),
    },
};
