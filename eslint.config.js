import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
    {
        ignores: ["build/", ".react-router/", "node_modules/"],
    },
    {
        files: ["**/*.{js,jsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.jest,
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            react,
            "react-hooks": reactHooks,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            "react/no-unescaped-entities": "off",
            "no-console": "off",
            "react-hooks/set-state-in-effect": "off",
            "react-hooks/refs": "off",
            "react-hooks/exhaustive-deps": "off",
            "no-constant-condition": "off",
            "no-prototype-builtins": "warn",
            "no-empty": "off",
            "react/no-unknown-property": "warn",
            "require-yield": "off",
            ...eslintConfigPrettier.rules,
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
    {
        files: [
            "**/*.test.{js,jsx}",
            "**/tests/**/*.{js,jsx}",
            "**/__tests__/**/*.{js,jsx}",
        ],
        rules: {
            "react/display-name": "off",
            "no-unused-vars": "off",
            "no-console": "off",
            "react-hooks/exhaustive-deps": "off",
        },
    },
    {
        files: ["public/service-worker.js", "public/sw-utils.js"],
        languageOptions: {
            globals: {
                ...globals.serviceworker,
                importScripts: "readonly",
                clients: "readonly",
                normalizeNotificationData: "readonly",
                normalizeUrl: "readonly",
                extractNotificationUrl: "readonly",
                handleNotificationClick: "readonly",
            },
        },
        rules: {
            "no-console": "off",
            "no-unused-vars": "off",
        },
    },
];
