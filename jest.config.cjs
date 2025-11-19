module.exports = {
    testEnvironment: "jsdom",
    transform: {
        "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
    },
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/app/$1",
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
