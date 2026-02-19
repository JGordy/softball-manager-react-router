module.exports = {
    testEnvironment: "jsdom",
    transform: {
        "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
    },
    transformIgnorePatterns: [
        "/node_modules/(?!(node-appwrite|node-fetch-native-with-agent)/).+\\.js$",
    ],
    // Path aliases - @/ covers most cases. Add others only if needed.
    // Keep in sync with vite.config.ts and tsconfig.json
    moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
            "<rootDir>/__mocks__/fileMock.js",
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
