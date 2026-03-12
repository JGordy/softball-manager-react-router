import { render, screen } from "@testing-library/react";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { parse } from "cookie";
import { createSessionClient } from "@/utils/appwrite/server";

import { Layout, loader, getThemePreference } from "./root";

// Mock Mantine components
jest.mock("@mantine/core", () => ({
    ...jest.requireActual("@mantine/core"),
    ColorSchemeScript: jest.fn(() => <div data-testid="color-scheme-script" />),
    MantineProvider: jest.fn(({ children }) => (
        <div data-testid="mantine-provider">{children}</div>
    )),
    createTheme: jest.fn(),
}));

// Mock React Router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useLoaderData: jest.fn(),
    Meta: () => <div data-testid="mock-meta" />,
    Links: () => <div data-testid="mock-links" />,
    ScrollRestoration: () => null,
    Scripts: () => null,
}));

// Mock Appwrite
jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
}));

// Mock Mantine sub-components
jest.mock("@mantine/notifications", () => ({
    Notifications: () => <div data-testid="mock-notifications" />,
}));

jest.mock("@mantine/modals", () => ({
    ModalsProvider: ({ children }) => (
        <div data-testid="mock-modals">{children}</div>
    ),
}));

import { useLoaderData } from "react-router";

describe("Root Route Logic", () => {
    describe("getThemePreference helper", () => {
        it("returns the correct theme for valid values", () => {
            expect(getThemePreference({ themePreference: "dark" })).toBe(
                "dark",
            );
            expect(getThemePreference({ themePreference: "light" })).toBe(
                "light",
            );
            expect(getThemePreference({ themePreference: "auto" })).toBe(
                "auto",
            );
        });

        it("falls back to auto for invalid or missing values", () => {
            expect(getThemePreference({ themePreference: "blue" })).toBe(
                "auto",
            );
            expect(getThemePreference({})).toBe("auto");
            expect(getThemePreference(null)).toBe("auto");
        });
    });

    describe("loader", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("returns default dark mode when no cookies or session", async () => {
            createSessionClient.mockRejectedValue(new Error("No session"));
            const request = {
                headers: { get: jest.fn().mockReturnValue(null) },
                url: "http://localhost/",
            };
            const result = await loader({ request });
            expect(result.themePreference).toBe("auto");
        });

        it("returns themePreference from cookies", async () => {
            createSessionClient.mockRejectedValue(new Error("No session"));
            const request = {
                headers: {
                    get: jest.fn().mockReturnValue("themePreference=dark"),
                },
                url: "http://localhost/",
            };
            const result = await loader({ request });
            expect(result.themePreference).toBe("dark");
        });

        it("returns themePreference from user preferences", async () => {
            const mockAccount = {
                getPrefs: jest
                    .fn()
                    .mockResolvedValue({ themePreference: "light" }),
            };
            createSessionClient.mockResolvedValue({ account: mockAccount });
            const request = {
                headers: { get: jest.fn().mockReturnValue(null) },
                url: "http://localhost/",
            };
            const result = await loader({ request });
            expect(result.themePreference).toBe("light");
        });
    });

    describe("Layout Component", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("passes dark themePreference to Mantine providers", () => {
            useLoaderData.mockReturnValue({ themePreference: "dark" });
            render(
                <Layout>
                    <div data-testid="content">Test</div>
                </Layout>,
            );

            expect(screen.getByTestId("content")).toBeInTheDocument();
            expect(ColorSchemeScript.mock.calls[0][0]).toEqual(
                expect.objectContaining({ defaultColorScheme: "dark" }),
            );
            expect(MantineProvider.mock.calls[0][0]).toEqual(
                expect.objectContaining({ defaultColorScheme: "dark" }),
            );
        });

        it("passes light themePreference to Mantine providers", () => {
            useLoaderData.mockReturnValue({ themePreference: "light" });
            render(
                <Layout>
                    <div data-testid="content">Test</div>
                </Layout>,
            );

            expect(ColorSchemeScript.mock.calls[0][0]).toEqual(
                expect.objectContaining({ defaultColorScheme: "light" }),
            );
            expect(MantineProvider.mock.calls[0][0]).toEqual(
                expect.objectContaining({ defaultColorScheme: "light" }),
            );
        });

        it("passes auto themePreference to Mantine providers", () => {
            useLoaderData.mockReturnValue({ themePreference: "auto" });
            render(
                <Layout>
                    <div data-testid="content">Test</div>
                </Layout>,
            );

            expect(ColorSchemeScript.mock.calls[0][0]).toEqual(
                expect.objectContaining({ defaultColorScheme: "auto" }),
            );
            expect(MantineProvider.mock.calls[0][0]).toEqual(
                expect.objectContaining({ defaultColorScheme: "auto" }),
            );
        });
    });
});
