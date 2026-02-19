import { MemoryRouter } from "react-router";
import { render, screen } from "@/utils/test-utils";

import { createSessionClient } from "@/utils/appwrite/server";

import App, { loader } from "./root";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    usePushNotificationListener: jest.fn(),
    Outlet: () => <div data-testid="outlet" />,
    ScrollRestoration: () => null,
    Scripts: () => null,
    Links: () => null,
    Meta: () => null,
}));

// Mock cookie parse
jest.mock("cookie", () => ({
    parse: jest.fn().mockImplementation((str) => {
        if (!str) return {};
        const obj = {};
        str.split(";").forEach((pair) => {
            const [key, val] = pair.trim().split("=");
            obj[key] = val;
        });
        return obj;
    }),
}));

// Mock Appwrite
jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
}));

// Mock hooks
jest.mock("@/hooks/usePushNotificationListener", () => ({
    usePushNotificationListener: jest.fn(),
}));

// Mock Umami
jest.mock("@/components/UmamiTracker", () => ({
    UmamiTracker: () => <div data-testid="umami" />,
}));

describe("Root Route", () => {
    describe("loader", () => {
        it("returns default dark mode when no cookies or session", async () => {
            createSessionClient.mockRejectedValue(new Error("No session"));

            const request = {
                headers: {
                    get: jest.fn().mockReturnValue(null),
                },
                url: "http://localhost/",
            };
            const result = await loader({ request });

            expect(result.darkMode).toBe(false);
            expect(result.preferences).toEqual({});
        });

        it("returns dark mode from cookies", async () => {
            createSessionClient.mockRejectedValue(new Error("No session"));

            const request = {
                headers: {
                    get: jest.fn().mockReturnValue("darkMode=true"),
                },
                url: "http://localhost/",
            };
            const result = await loader({ request });

            expect(result.darkMode).toBe(true);
        });

        it("returns dark mode from user preferences", async () => {
            const mockAccount = {
                getPrefs: jest.fn().mockResolvedValue({ darkMode: "true" }),
            };
            createSessionClient.mockResolvedValue({ account: mockAccount });

            const request = {
                headers: {
                    get: jest.fn().mockReturnValue(null),
                },
                url: "http://localhost/",
            };
            const result = await loader({ request });

            expect(result.darkMode).toBe(true);
            expect(result.preferences.darkMode).toBe("true");
        });
    });

    describe("Component", () => {
        it("renders without crashing", () => {
            const loaderData = { darkMode: false, preferences: {} };

            render(
                <MemoryRouter>
                    <App loaderData={loaderData} />
                </MemoryRouter>,
            );

            expect(screen.getByTestId("outlet")).toBeInTheDocument();
        });
    });
});
