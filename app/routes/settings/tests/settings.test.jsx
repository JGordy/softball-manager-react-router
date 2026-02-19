import { MemoryRouter, useLoaderData, useOutletContext } from "react-router";
import { render, screen } from "@/utils/test-utils";

import { createSessionClient } from "@/utils/appwrite/server";
import { logoutAction } from "@/actions/logout";
import { updateUser } from "@/actions/users";

import Settings, { loader, action } from "../index";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useLoaderData: jest.fn(),
    useOutletContext: jest.fn(),
    useNavigation: jest.fn(() => ({ state: "idle" })),
    useFetcher: jest.fn(() => ({
        submit: jest.fn(),
        data: null,
        state: "idle",
    })),
}));

// Mock actions
jest.mock("@/actions/logout", () => ({ logoutAction: jest.fn() }));
jest.mock("@/actions/users", () => ({
    updateUser: jest.fn(),
    updateAccountInfo: jest.fn(),
    updatePassword: jest.fn(),
    resetPassword: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
}));

// Mock sub-components
jest.mock("../components/AccountPanel", () => () => (
    <div data-testid="account-panel" />
));
jest.mock("../components/AuthPanel", () => () => (
    <div data-testid="auth-panel" />
));
jest.mock("../components/NotificationsPanel", () => () => (
    <div data-testid="notifications-panel" />
));
jest.mock("../components/SupportPanel", () => () => (
    <div data-testid="support-panel" />
));

describe("Settings Route", () => {
    const mockUser = {
        $id: "user-123",
        email: "test@example.com",
        name: "Test User",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useOutletContext.mockReturnValue({ user: mockUser });
        useLoaderData.mockReturnValue({ teams: [] });
    });

    describe("loader", () => {
        it("fetches teams and handles pagination", async () => {
            const mockTeamsList = jest
                .fn()
                .mockResolvedValueOnce({
                    teams: Array(100).fill({ $id: "team-1" }),
                })
                .mockResolvedValueOnce({ teams: [{ $id: "team-101" }] });

            createSessionClient.mockResolvedValue({
                teams: { list: mockTeamsList },
            });

            const result = await loader({
                request: new Request("http://localhost/"),
            });
            expect(result.teams.length).toBe(101);
            expect(mockTeamsList).toHaveBeenCalledTimes(2);
        });
    });

    describe("action", () => {
        it("calls logoutAction", async () => {
            const formData = new FormData();
            formData.append("_action", "logout");
            await action({
                request: new Request("http://localhost/", {
                    method: "POST",
                    body: formData,
                }),
            });
            expect(logoutAction).toHaveBeenCalled();
        });

        it("calls updateUser on update-profile-info", async () => {
            const formData = new FormData();
            formData.append("_action", "update-profile-info");
            formData.append("userId", "user-123");
            formData.append("name", "New Name");
            await action({
                request: new Request("http://localhost/", {
                    method: "POST",
                    body: formData,
                }),
            });
            expect(updateUser).toHaveBeenCalledWith({
                userId: "user-123",
                values: { name: "New Name" },
            });
        });
    });

    describe("Component", () => {
        it("renders accordion panels", () => {
            render(
                <MemoryRouter>
                    <Settings />
                </MemoryRouter>,
            );

            expect(screen.getByText("Account")).toBeInTheDocument();
            expect(screen.getByText("Login Options")).toBeInTheDocument();
            expect(screen.getByText("Notifications")).toBeInTheDocument();
            expect(screen.getByText("Support")).toBeInTheDocument();
        });
    });
});
