module.exports = {
    testEnvironment: "jsdom",
    transform: {
        "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
    },
    transformIgnorePatterns: [
        "/node_modules/(?!(node-appwrite|node-fetch-native-with-agent)/).+\\.js$",
    ],
    moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
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
