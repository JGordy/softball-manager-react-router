/* eslint-disable react/display-name */
import { useOutletContext } from "react-router";
import { render, screen } from "@/utils/test-utils";

import * as teamsLoaders from "@/loaders/teams";
import * as gamesActions from "@/actions/games";
import * as usersActions from "@/actions/users";
import * as seasonsActions from "@/actions/seasons";
import * as teamsActions from "@/actions/teams";
import * as invitationsActions from "@/actions/invitations";
import { useResponseNotification } from "@/utils/showNotification";

import TeamDetails, { loader, action } from "../details";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useOutletContext: jest.fn(),
    useNavigation: jest.fn(() => ({ state: "idle" })),
}));

jest.mock("@/loaders/teams");
jest.mock("@/actions/games");
jest.mock("@/actions/users");
jest.mock("@/actions/seasons");
jest.mock("@/actions/teams");
jest.mock("@/actions/invitations");
jest.mock("@/utils/showNotification");
jest.mock("@/utils/appwrite/server", () => ({
    __esModule: true,
    createSessionClient: jest.fn().mockResolvedValue({ tablesDB: {} }),
}));

jest.mock("../components/PlayerList", () => () => (
    <div data-testid="player-list" />
));
jest.mock("../components/SeasonList", () => () => (
    <div data-testid="season-list" />
));
jest.mock("../components/GamesList", () => () => (
    <div data-testid="games-list" />
));
jest.mock("../components/TeamMenu", () => () => (
    <div data-testid="team-menu" />
));
jest.mock("@/components/BackButton", () => () => (
    <div data-testid="back-button" />
));
jest.mock("../components/MobileTeamDetails", () => () => (
    <div data-testid="mobile-team-details" />
));
jest.mock("../components/DesktopTeamDetails", () => () => (
    <div data-testid="desktop-team-details" />
));
jest.mock("@/components/OnboardingTour", () => () => (
    <div data-testid="onboarding-tour" />
));

describe("TeamDetails Route", () => {
    const originalEnv = process.env;

    beforeAll(() => {
        process.env = { ...originalEnv };
        process.env.APPWRITE_ENDPOINT = "http://localhost/v1";
        process.env.APPWRITE_PROJECT_ID = "test";
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    const mockUser = { $id: "user1", firstName: "John", lastName: "Doe" };
    const mockTeam = {
        $id: "team1",
        name: "Test Team",
        leagueName: "Test League",
        primaryColor: "blue",
        seasons: [
            {
                $id: "season1",
                name: "Season 1",
                games: [{ $id: "game1" }],
            },
        ],
    };
    const mockLoaderData = {
        teamData: mockTeam,
        players: [{ $id: "player1", firstName: "Player", lastName: "One" }],
        managerIds: ["user1"],
        ownerIds: ["user1"],
        teamLogs: [],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useOutletContext.mockReturnValue({ user: mockUser, isDesktop: true });
    });

    describe("loader", () => {
        it("calls getTeamById with correct params", async () => {
            const params = { teamId: "team1" };
            const request = { url: "http://localhost/team/team1" };
            await loader({ params, request });
            expect(teamsLoaders.getTeamById).toHaveBeenCalledWith({
                teamId: "team1",
                client: expect.any(Object),
            });
        });
    });

    describe("action", () => {
        const params = { teamId: "team1" };

        it("calls createPlayer for add-player action", async () => {
            const formData = new FormData();
            formData.append("_action", "add-player");
            formData.append("name", "New Player");
            const request = {
                formData: () => Promise.resolve(formData),
                headers: { get: jest.fn() },
            };

            await action({ request, params });
            expect(usersActions.createPlayer).toHaveBeenCalledWith(
                expect.objectContaining({
                    values: expect.objectContaining({ name: "New Player" }),
                    teamId: "team1",
                    client: expect.any(Object),
                }),
            );
        });

        it("calls updatePreferences for update-preferences action", async () => {
            const formData = new FormData();
            formData.append("_action", "update-preferences");
            formData.append("maxMaleBatters", "3");
            const request = {
                formData: () => Promise.resolve(formData),
                headers: { get: jest.fn() },
            };

            await action({ request, params });
            expect(teamsActions.updatePreferences).toHaveBeenCalledWith(
                expect.objectContaining({
                    teamId: "team1",
                    prefs: expect.objectContaining({ maxMaleBatters: "3" }),
                }),
            );
        });

        it("calls invitePlayersServer for invite-player action", async () => {
            const formData = new FormData();
            formData.append("_action", "invite-player");
            formData.append("email", "test@test.com");
            formData.append("name", "Test User");
            const request = {
                url: "http://localhost/team/team1",
                formData: () => Promise.resolve(formData),
                headers: { get: jest.fn() },
            };

            await action({ request, params });
            expect(invitationsActions.invitePlayersServer).toHaveBeenCalledWith(
                {
                    players: [{ email: "test@test.com", name: "Test User" }],
                    teamId: "team1",
                    url: "http://localhost/team/team1/accept-invite",
                    client: expect.any(Object),
                },
            );
        });

        it("calls createSeason for add-season action", async () => {
            const formData = new FormData();
            formData.append("_action", "add-season");
            formData.append("name", "New Season");
            const request = {
                formData: () => Promise.resolve(formData),
                headers: { get: jest.fn() },
            };

            await action({ request, params });
            expect(seasonsActions.createSeason).toHaveBeenCalledWith(
                expect.objectContaining({
                    values: expect.objectContaining({ name: "New Season" }),
                    teamId: "team1",
                    client: expect.any(Object),
                }),
            );
        });

        it("calls updateTeam for edit-team action", async () => {
            const formData = new FormData();
            formData.append("_action", "edit-team");
            formData.append("name", "Updated Team");
            const request = {
                formData: () => Promise.resolve(formData),
                headers: { get: jest.fn() },
            };

            await action({ request, params });
            expect(teamsActions.updateTeam).toHaveBeenCalledWith(
                expect.objectContaining({
                    values: expect.objectContaining({ name: "Updated Team" }),
                    teamId: "team1",
                    client: expect.any(Object),
                }),
            );
        });

        it("calls createSingleGame for add-single-game action", async () => {
            const formData = new FormData();
            formData.append("_action", "add-single-game");
            formData.append("opponent", "Opponent");
            const request = {
                formData: () => Promise.resolve(formData),
                headers: { get: jest.fn() },
            };

            await action({ request, params });
            expect(gamesActions.createSingleGame).toHaveBeenCalledWith(
                expect.objectContaining({
                    values: expect.objectContaining({ opponent: "Opponent" }),
                    teamId: "team1",
                    client: expect.any(Object),
                }),
            );
        });

        it("calls updateMemberRole for update-role action", async () => {
            const formData = new FormData();
            formData.append("_action", "update-role");
            formData.append("playerId", "player1");
            formData.append("role", "manager");
            const request = {
                formData: () => Promise.resolve(formData),
                headers: { get: jest.fn() },
            };

            await action({ request, params });
            expect(teamsActions.updateMemberRole).toHaveBeenCalledWith(
                expect.objectContaining({
                    values: expect.objectContaining({
                        playerId: "player1",
                        role: "manager",
                    }),
                    teamId: "team1",
                    client: expect.any(Object),
                }),
            );
        });

        it("calls syncInvitedPlayersServer for invite-player-sync JSON action with players", async () => {
            const players = [
                { email: "a@b.com", name: "A", userId: "u1", success: true },
            ];
            const request = {
                url: "http://localhost/team/team1",
                json: () =>
                    Promise.resolve({ _action: "invite-player-sync", players }),
                headers: { get: jest.fn(() => "application/json") },
            };

            await action({ request, params });
            expect(
                invitationsActions.syncInvitedPlayersServer,
            ).toHaveBeenCalledWith({
                players,
                teamId: "team1",
            });
        });

        it("returns error response for invite-player-sync JSON action with error field", async () => {
            const request = {
                url: "http://localhost/team/team1",
                json: () =>
                    Promise.resolve({
                        _action: "invite-player-sync",
                        error: "Something failed",
                    }),
                headers: { get: jest.fn(() => "application/json") },
            };

            const result = await action({ request, params });
            expect(result).toEqual({
                success: false,
                message: "Something failed",
            });
            expect(
                invitationsActions.syncInvitedPlayersServer,
            ).not.toHaveBeenCalled();
        });
    });

    describe("Component", () => {
        it("renders team details correctly", () => {
            render(<TeamDetails loaderData={mockLoaderData} />);

            expect(screen.getByText("Test Team")).toBeInTheDocument();
            expect(screen.getByText("Test League")).toBeInTheDocument();
            expect(screen.getByTestId("back-button")).toBeInTheDocument();
            expect(screen.getByTestId("team-menu")).toBeInTheDocument();
        });

        it("calls useResponseNotification with actionData", () => {
            const actionData = { success: true };
            render(
                <TeamDetails
                    loaderData={mockLoaderData}
                    actionData={actionData}
                />,
            );
            expect(useResponseNotification).toHaveBeenCalledWith(actionData);
        });

        it("does not render TeamMenu if user is not manager", () => {
            const nonManagerLoaderData = {
                ...mockLoaderData,
                managerIds: ["other-user"],
            };
            render(<TeamDetails loaderData={nonManagerLoaderData} />);
            expect(screen.queryByTestId("team-menu")).not.toBeInTheDocument();
        });

        it("renders Mobile and Desktop details components", () => {
            render(<TeamDetails loaderData={mockLoaderData} />);

            expect(
                screen.getByTestId("mobile-team-details"),
            ).toBeInTheDocument();
            expect(
                screen.getByTestId("desktop-team-details"),
            ).toBeInTheDocument();
        });

        it("renders OnboardingTour component for managers", () => {
            render(<TeamDetails loaderData={mockLoaderData} />);
            expect(screen.getByTestId("onboarding-tour")).toBeInTheDocument();
        });

        it("does not render OnboardingTour component for non-managers", () => {
            const nonManagerLoaderData = {
                ...mockLoaderData,
                managerIds: ["other-user"],
            };
            render(<TeamDetails loaderData={nonManagerLoaderData} />);
            expect(
                screen.queryByTestId("onboarding-tour"),
            ).not.toBeInTheDocument();
        });
    });
});
