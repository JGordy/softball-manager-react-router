import { render, screen } from "@testing-library/react";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";

import { Layout } from "./root";

// Mock Mantine components and props
jest.mock("@mantine/core", () => ({
    ...jest.requireActual("@mantine/core"),
    ColorSchemeScript: jest.fn(() => <div data-testid="color-scheme-script" />),
    MantineProvider: jest.fn(({ children }) => (
        <div data-testid="mantine-provider">{children}</div>
    )),
    mantineHtmlProps: {},
}));

// Mock React Router components used in Layout
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useLoaderData: jest.fn(),
    Meta: () => <div data-testid="mock-meta" />,
    Links: () => <div data-testid="mock-links" />,
    ScrollRestoration: () => null,
    Scripts: () => null,
}));

import { useLoaderData } from "react-router";

// Mock Mantine sub-components to prevent them from requiring context
jest.mock("@mantine/notifications", () => ({
    Notifications: () => <div data-testid="mock-notifications" />,
}));

jest.mock("@mantine/modals", () => ({
    ModalsProvider: ({ children }) => <>{children}</>,
}));

describe("Root Layout Theme Logic", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("applies dark mode to ColorSchemeScript and MantineProvider when themePreference is dark", () => {
        useLoaderData.mockReturnValue({ themePreference: "dark" });
        render(
            <Layout>
                <div data-testid="test-children">Test content</div>
            </Layout>,
        );

        expect(screen.getByTestId("test-children")).toBeInTheDocument();

        expect(ColorSchemeScript.mock.calls[0][0]).toEqual(
            expect.objectContaining({ defaultColorScheme: "dark" }),
        );
        expect(MantineProvider.mock.calls[0][0]).toEqual(
            expect.objectContaining({ defaultColorScheme: "dark" }),
        );
    });

    it("applies light mode to ColorSchemeScript and MantineProvider when themePreference is light", () => {
        useLoaderData.mockReturnValue({ themePreference: "light" });
        render(
            <Layout>
                <div data-testid="test-children-light">Test content</div>
            </Layout>,
        );

        expect(screen.getByTestId("test-children-light")).toBeInTheDocument();

        expect(ColorSchemeScript.mock.calls[0][0]).toEqual(
            expect.objectContaining({ defaultColorScheme: "light" }),
        );
        expect(MantineProvider.mock.calls[0][0]).toEqual(
            expect.objectContaining({ defaultColorScheme: "light" }),
        );
    });

    it("applies auto mode to ColorSchemeScript and MantineProvider when themePreference is auto", () => {
        useLoaderData.mockReturnValue({ themePreference: "auto" });
        render(
            <Layout>
                <div data-testid="test-children-auto">Test content</div>
            </Layout>,
        );

        expect(screen.getByTestId("test-children-auto")).toBeInTheDocument();

        expect(ColorSchemeScript.mock.calls[0][0]).toEqual(
            expect.objectContaining({ defaultColorScheme: "auto" }),
        );
        expect(MantineProvider.mock.calls[0][0]).toEqual(
            expect.objectContaining({ defaultColorScheme: "auto" }),
        );
    });

    it("falls back to auto mode when themePreference is invalid", () => {
        useLoaderData.mockReturnValue({ themePreference: "invalid-theme" });
        render(
            <Layout>
                <div data-testid="test-children-invalid">Test content</div>
            </Layout>,
        );

        expect(screen.getByTestId("test-children-invalid")).toBeInTheDocument();

        expect(ColorSchemeScript.mock.calls[0][0]).toEqual(
            expect.objectContaining({ defaultColorScheme: "auto" }),
        );
        expect(MantineProvider.mock.calls[0][0]).toEqual(
            expect.objectContaining({ defaultColorScheme: "auto" }),
        );
    });
});
