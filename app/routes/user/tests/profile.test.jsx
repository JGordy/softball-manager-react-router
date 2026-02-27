import {
    useNavigate,
    useLocation,
    useOutletContext,
    useActionData,
} from "react-router";

import { render, screen, fireEvent } from "@/utils/test-utils";

import * as usersActions from "@/actions/users";
import * as usersLoaders from "@/loaders/users";

import UserProfile, { action, loader } from "../profile";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigate: jest.fn(),
    useLocation: jest.fn(),
    useOutletContext: jest.fn(),
    useActionData: jest.fn(),
}));

jest.mock("@/actions/users");
jest.mock("@/loaders/users");

jest.mock("@/components/UserHeader", () => ({ children }) => (
    <div data-testid="user-header">{children}</div>
));
jest.mock("@/components/PersonalDetails", () => () => (
    <div data-testid="personal-details" />
));
jest.mock("@/components/PlayerDetails", () => () => (
    <div data-testid="player-details" />
));
jest.mock("../components/PlayerAwards", () => () => (
    <div data-testid="player-awards" />
));
jest.mock("../components/PlayerStats", () => () => (
    <div data-testid="player-stats" />
));
jest.mock("../components/ProfileMenu", () => () => (
    <div data-testid="profile-menu" />
));

describe("UserProfile Route Component", () => {
    const mockPlayer = {
        $id: "user-1",
        name: "Test User",
        userId: "user-1",
    };

    const mockLoaderData = {
        player: mockPlayer,
        awardsPromise: Promise.resolve([]),
        defaultTab: "player",
    };

    const mockNavigate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
        useLocation.mockReturnValue({ hash: "" });
        useOutletContext.mockReturnValue({ user: { $id: "user-1" } });
        useActionData.mockReturnValue(null);
    });

    describe("loader", () => {
        it("returns player data, awards promise, and default tab", async () => {
            usersLoaders.getUserById.mockResolvedValue(mockPlayer);
            usersLoaders.getAwardsByUserId.mockResolvedValue([]);

            usersLoaders.getAttendanceByUserId.mockResolvedValue([]);
            usersLoaders.getStatsByUserId.mockResolvedValue({});

            const params = { userId: "user-1" };
            const request = { url: "http://localhost/user/user-1#stats" };

            const result = await loader({ params, request });

            expect(usersLoaders.getUserById).toHaveBeenCalledWith({
                userId: "user-1",
            });
            expect(usersLoaders.getAwardsByUserId).toHaveBeenCalledWith({
                userId: "user-1",
            });
            expect(usersLoaders.getAttendanceByUserId).toHaveBeenCalledWith({
                userId: "user-1",
            });
            expect(usersLoaders.getStatsByUserId).toHaveBeenCalledWith({
                userId: "user-1",
            });
            expect(result.player).toEqual(mockPlayer);
            expect(result.defaultTab).toBe("stats");
        });

        it("defaults to player tab if invalid hash provided", async () => {
            usersLoaders.getUserById.mockResolvedValue(mockPlayer);
            usersLoaders.getAwardsByUserId.mockResolvedValue([]);

            const params = { userId: "user-1" };
            const request = { url: "http://localhost/user/user-1#invalid" };

            const result = await loader({ params, request });

            expect(result.defaultTab).toBe("player");
        });
    });

    describe("action", () => {
        it("calls updateUser for edit-player action", async () => {
            const formData = new FormData();
            formData.append("_action", "edit-player");
            formData.append("name", "Updated Name");
            const request = { formData: () => Promise.resolve(formData) };
            const params = { userId: "user-1" };

            await action({ request, params });

            expect(usersActions.updateUser).toHaveBeenCalledWith({
                values: { name: "Updated Name" },
                userId: "user-1",
            });
        });

        it("returns undefined for unknown action", async () => {
            const formData = new FormData();
            formData.append("_action", "unknown");
            const request = { formData: () => Promise.resolve(formData) };
            const params = { userId: "user-1" };

            const result = await action({ request, params });
            expect(result).toBeUndefined();
        });
    });

    describe("Component", () => {
        it("renders correctly with player tab", () => {
            render(<UserProfile loaderData={mockLoaderData} />);

            expect(screen.getByTestId("user-header")).toBeInTheDocument();
            expect(screen.getAllByTestId("personal-details")).toHaveLength(2);
            expect(screen.getAllByTestId("player-details")).toHaveLength(2);
            // The ProfileMenu is rendered within a conditional
            expect(screen.getByTestId("profile-menu")).toBeInTheDocument();
        });

        it("switches tabs and updates URL hash", () => {
            render(<UserProfile loaderData={mockLoaderData} />);

            const statsTabs = screen.getAllByText("Stats");
            fireEvent.click(statsTabs[0]);

            // It should update hash and change visible component
            expect(mockNavigate).toHaveBeenCalled();
            const lastCall =
                mockNavigate.mock.calls[mockNavigate.mock.calls.length - 1];
            expect(lastCall[0]).toContain("stats");
        });

        it("displays incomplete profile alert if fields are missing", () => {
            const incompletePlayer = { ...mockPlayer, name: "" }; // Assuming name is required
            render(
                <UserProfile
                    loaderData={{ ...mockLoaderData, player: incompletePlayer }}
                />,
            );

            expect(
                screen.getByText("Your profile is incomplete!"),
            ).toBeInTheDocument();
        });

        it("hides ProfileMenu if not the current user", () => {
            useOutletContext.mockReturnValue({ user: { $id: "user-other" } });
            render(<UserProfile loaderData={mockLoaderData} />);

            expect(
                screen.queryByTestId("profile-menu"),
            ).not.toBeInTheDocument();
        });
    });
});
