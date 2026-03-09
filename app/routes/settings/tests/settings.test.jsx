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

jest.mock("../components/DesktopSettingsDashboard", () => () => (
    <div data-testid="desktop-settings-dashboard" />
));
jest.mock("../components/MobileSettingsContainer", () => () => (
    <div data-testid="mobile-settings-container" />
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
        it("renders MobileSettingsContainer on mobile", () => {
            useOutletContext.mockReturnValue({
                user: mockUser,
                isDesktop: false,
            });
            render(
                <MemoryRouter>
                    <Settings />
                </MemoryRouter>,
            );

            expect(
                screen.getByTestId("mobile-settings-container"),
            ).toBeInTheDocument();
        });

        it("renders DesktopSettingsDashboard on desktop", () => {
            useOutletContext.mockReturnValue({
                user: mockUser,
                isDesktop: true,
            });
            render(
                <MemoryRouter>
                    <Settings />
                </MemoryRouter>,
            );

            expect(
                screen.getByTestId("desktop-settings-dashboard"),
            ).toBeInTheDocument();
        });
    });
});
