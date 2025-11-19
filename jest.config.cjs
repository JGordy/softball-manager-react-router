module.exports = {
    testEnvironment: "jsdom",
    transform: {
        "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
    },
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/app/$1",
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    globals: {
        "import.meta": {
            env: {
                VITE_GOOGLE_SERVICES_API_KEY: "test-api-key",
            },
        },
    },
};
