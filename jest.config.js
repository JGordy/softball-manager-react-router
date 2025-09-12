export default {
    testEnvironment: "jsdom",
    transform: {
        "^.+\\.(t|j)sx?$": "babel-jest",
    },
    transformIgnorePatterns: ["/node_modules/(?!@mantine|@tabler)"],
    moduleNameMapper: {
        ".(css|less|scss|sass)": "identity-obj-proxy",
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
    },
    setupFilesAfterEnv: ["./jest.setup.js"],
};
