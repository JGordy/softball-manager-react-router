import { render, screen } from "@/utils/test-utils";

import * as gamesLoaders from "@/loaders/games";
import * as gamesActions from "@/actions/games";
import * as gameLogActions from "@/actions/gameLogs";

import Gameday, { loader, action } from "../gameday";

// Mock dependencies
jest.mock("react-router", () => ({
    useLoaderData: jest.fn(),
    useOutletContext: jest.fn(),
    useActionData: jest.fn(),
    useNavigate: jest.fn(),
    Form: ({ children, ...props }) => <form {...props}>{children}</form>,
}));

jest.mock("@/loaders/games");
jest.mock("@/actions/games");
jest.mock("@/actions/gameLogs");
jest.mock("@/utils/showNotification");
jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/components/BackButton", () => () => <button>Back</button>);
jest.mock("@/components/DeferredLoader", () => ({ children, resolve }) => (
    <div>{children(resolve)}</div>
));

jest.mock("../components/GamedayContainer", () => () => (
    <div data-testid="gameday-container" />
));
jest.mock("../components/GamedayLoadingSkeleton", () => () => (
    <div data-testid="gameday-skeleton" />
));
jest.mock("../components/GamedayMenu", () => () => (
    <div data-testid="gameday-menu" />
));

describe("Gameday Route", () => {
    const originalEnv = process.env;

    beforeAll(() => {
        process.env = { ...originalEnv };
        process.env.APPWRITE_ENDPOINT = "http://localhost/v1";
        process.env.APPWRITE_PROJECT_ID = "test";
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    const mockLoaderData = {
        game: {
            $id: "game123",
            gameDate: "2023-01-01",
            playerChart: [],
            gameFinal: false,
        },
        deferredData: { logs: [] },
        teams: [{ id: "team1" }],
        scorekeeperIds: ["user123"],
    };

    const mockUser = { $id: "user123" };

    beforeEach(() => {
        jest.clearAllMocks();
        require("react-router").useLoaderData.mockReturnValue(mockLoaderData);
        require("react-router").useOutletContext.mockReturnValue({
            user: mockUser,
        });
    });

    describe("Loader", () => {
        it("calls getEventById with correct params", async () => {
            const params = { eventId: "game123" };
            const request = { url: "http://test.com" };
            await loader({ params, request });
            expect(gamesLoaders.getEventById).toHaveBeenCalledWith({
                eventId: "game123",
                client: expect.any(Object),
                includeWeather: false,
                includeAttendance: false,
                includeAwards: false,
                includeVotes: false,
                includePark: false,
            });
        });
    });

    describe("Action", () => {
        it("handles log-game-event action", async () => {
            const formData = new FormData();
            formData.append("_action", "log-game-event");
            formData.append("someData", "value");
            formData.append("baseState", JSON.stringify({ prop: "val" }));

            const request = {
                formData: () => Promise.resolve(formData),
            };
            const params = { eventId: "game123" };

            await action({ request, params });

            expect(gameLogActions.logGameEvent).toHaveBeenCalledWith({
                gameId: "game123",
                someData: "value",
                baseState: { prop: "val" },
                client: expect.any(Object),
            });
        });

        it("handles undo-game-event action", async () => {
            const formData = new FormData();
            formData.append("_action", "undo-game-event");
            formData.append("logId", "log1");
            formData.append("playerChart", JSON.stringify([{ id: "1" }]));

            const request = {
                formData: () => Promise.resolve(formData),
            };
            const params = { eventId: "game123" };

            gameLogActions.undoGameEvent.mockResolvedValue({ success: true });

            // Mock lineups action
            const lineupsActions = require("@/actions/lineups");
            jest.spyOn(lineupsActions, "savePlayerChart").mockResolvedValue({});

            await action({ request, params });

            expect(gameLogActions.undoGameEvent).toHaveBeenCalled();
            expect(lineupsActions.savePlayerChart).toHaveBeenCalled();
        });

        it("skips savePlayerChart if undoGameEvent fails", async () => {
            const formData = new FormData();
            formData.append("_action", "undo-game-event");
            formData.append("logId", "log1");
            formData.append("playerChart", JSON.stringify([{ id: "1" }]));

            const request = {
                formData: () => Promise.resolve(formData),
            };
            const params = { eventId: "game123" };

            gameLogActions.undoGameEvent.mockResolvedValue({
                success: false,
                error: "Undo failed",
            });

            const lineupsActions = require("@/actions/lineups");
            jest.spyOn(lineupsActions, "savePlayerChart");

            const result = await action({ request, params });

            expect(gameLogActions.undoGameEvent).toHaveBeenCalled();
            expect(lineupsActions.savePlayerChart).not.toHaveBeenCalled();
            expect(result.error).toBe("Undo failed");
        });

        it("handles update-game-score action", async () => {
            const formData = new FormData();
            formData.append("_action", "update-game-score");
            formData.append("score", "10");

            const request = {
                formData: () => Promise.resolve(formData),
            };
            const params = { eventId: "game123" };

            await action({ request, params });

            expect(gamesActions.updateGame).toHaveBeenCalledWith({
                values: { score: "10" },
                eventId: "game123",
                client: expect.any(Object),
            });
        });

        it("handles substitute-player action", async () => {
            const formData = new FormData();
            formData.append("_action", "substitute-player");
            formData.append("playerChart", JSON.stringify([{ id: "1" }]));
            formData.append("baseState", JSON.stringify({ first: "123" }));
            formData.append("playerId", "sub999");

            const request = {
                formData: () => Promise.resolve(formData),
            };
            const params = { eventId: "game123" };

            gameLogActions.logGameEvent.mockResolvedValue({
                success: true,
                log: { $id: "log1" },
            });
            const lineupsActions = require("@/actions/lineups");
            jest.spyOn(lineupsActions, "savePlayerChart").mockResolvedValue({
                success: true,
            });

            await action({ request, params });

            expect(gameLogActions.logGameEvent).toHaveBeenCalled();
            expect(lineupsActions.savePlayerChart).toHaveBeenCalled();
        });

        it("skips savePlayerChart if logGameEvent fails during substitution", async () => {
            const formData = new FormData();
            formData.append("_action", "substitute-player");
            formData.append("playerChart", JSON.stringify([{ id: "1" }]));
            formData.append("playerId", "sub999");

            const request = {
                formData: () => Promise.resolve(formData),
            };
            const params = { eventId: "game123" };

            gameLogActions.logGameEvent.mockResolvedValue({
                success: false,
                error: "Log failed",
            });
            const lineupsActions = require("@/actions/lineups");
            jest.spyOn(lineupsActions, "savePlayerChart");

            const result = await action({ request, params });

            expect(gameLogActions.logGameEvent).toHaveBeenCalled();
            expect(lineupsActions.savePlayerChart).not.toHaveBeenCalled();
            expect(result.error).toBe("Log failed");
        });

        it("returns error if savePlayerChart fails during substitution", async () => {
            const formData = new FormData();
            formData.append("_action", "substitute-player");
            formData.append("playerChart", JSON.stringify([{ id: "1" }]));
            formData.append("playerId", "sub999");

            const request = {
                formData: () => Promise.resolve(formData),
            };
            const params = { eventId: "game123" };

            gameLogActions.logGameEvent.mockResolvedValue({
                success: true,
                log: { $id: "log1" },
            });
            const lineupsActions = require("@/actions/lineups");
            jest.spyOn(lineupsActions, "savePlayerChart").mockResolvedValue({
                success: false,
                error: "Chart save failed",
            });

            const result = await action({ request, params });

            expect(gameLogActions.logGameEvent).toHaveBeenCalled();
            expect(lineupsActions.savePlayerChart).toHaveBeenCalled();
            expect(result.error).toBe("Chart save failed");
        });

        it("rolls back the log if savePlayerChart fails during substitution", async () => {
            const formData = new FormData();
            formData.append("_action", "substitute-player");
            formData.append("playerChart", JSON.stringify([{ id: "1" }]));
            formData.append("playerId", "sub999");

            const request = {
                formData: () => Promise.resolve(formData),
            };
            const params = { eventId: "game123" };

            // logGameEvent succeeds
            gameLogActions.logGameEvent.mockResolvedValue({
                $id: "log123",
                success: true,
            });

            // savePlayerChart fails
            const lineupsActions = require("@/actions/lineups");
            jest.spyOn(lineupsActions, "savePlayerChart").mockResolvedValue({
                success: false,
                error: "Chart save failed",
            });

            const result = await action({ request, params });

            expect(gameLogActions.logGameEvent).toHaveBeenCalled();
            expect(lineupsActions.savePlayerChart).toHaveBeenCalled();
            // Verify undoGameEvent was called for the rollback
            expect(gameLogActions.undoGameEvent).toHaveBeenCalledWith({
                logId: "log123",
                client: expect.any(Object),
            });
            expect(result.error).toBe("Chart save failed");
        });

        it("handles save-player-chart action", async () => {
            const formData = new FormData();
            formData.append("_action", "save-player-chart");
            formData.append("playerChart", JSON.stringify([{ id: "1" }]));

            const request = {
                formData: () => Promise.resolve(formData),
            };
            const params = { eventId: "game123" };

            const lineupsActions = require("@/actions/lineups");
            jest.spyOn(lineupsActions, "savePlayerChart").mockResolvedValue({});

            await action({ request, params });

            expect(lineupsActions.savePlayerChart).toHaveBeenCalledWith({
                values: { playerChart: [{ id: "1" }] },
                eventId: "game123",
                client: expect.any(Object),
            });
        });
    });

    describe("Component", () => {
        it("renders gameday container", () => {
            render(<Gameday />);
            expect(screen.getByTestId("gameday-container")).toBeInTheDocument();
        });
    });
});
