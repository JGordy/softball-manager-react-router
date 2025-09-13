export default {
    testEnvironment: "jsdom",
    transform: {
        // Use babel-jest to transpile tests with a Babel preset
        "^.+\\.(t|j)sx?$": "babel-jest",
    },
    // Don't transform anything in node_modules except for these packages
    transformIgnorePatterns: ["/node_modules/(?!(react-router|dnd-core)/)"],
    moduleNameMapper: {
        // Mock CSS imports
        ".(css|less|scss|sass)": "identity-obj-proxy",

        // Your project path aliases
        "^~/(.*)$": "<rootDir>/app/$1",
        "^@/(.*)$": "<rootDir>/app/$1",
        "^@actions/(.*)$": "<rootDir>/app/actions/$1",
        "^@components/(.*)$": "<rootDir>/app/components/$1",
        "^@constants/(.*)$": "<rootDir>/app/constants/$1",
        "^@contexts/(.*)$": "<rootDir>/app/contexts/$1",
        "^@form/(.*)$": "<rootDir>/app/forms/$1",
        "^@hooks/(.*)$": "<rootDir>/app/hooks/$1",
        "^@loaders/(.*)$": "<rootDir>/app/loaders/$1",
        "^@routes/(.*)$": "<rootDir>/app/routes/$1",
        "^@styles/(.*)$": "<rootDir>/app/styles/$1",
        "^@test-utils$": "<rootDir>/app/test-utils/index.js",
        "^@test-utils/(.*)$": "<rootDir>/app/test-utils/$1",

        // --- MANTINE FIX ---
        // Force Jest to use the CommonJS build for each Mantine package
        "^@mantine/core$": "<rootDir>/node_modules/@mantine/core/cjs/index.cjs",
        "^@mantine/dates$":
            "<rootDir>/node_modules/@mantine/dates/cjs/index.cjs",
        "^@mantine/hooks$":
            "<rootDir>/node_modules/@mantine/hooks/cjs/index.cjs",
        "^@mantine/modals$":
            "<rootDir>/node_modules/@mantine/modals/cjs/index.cjs",
        "^@mantine/notifications$":
            "<rootDir>/node_modules/@mantine/notifications/cjs/index.cjs",
    },
    setupFilesAfterEnv: ["./jest.setup.js"],
};
