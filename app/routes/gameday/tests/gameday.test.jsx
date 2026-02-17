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
            const request = {};
            await loader({ params, request });

            expect(gamesLoaders.getEventById).toHaveBeenCalledWith({
                eventId: "game123",
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
            });
        });

        it("handles undo-game-event action", async () => {
            const formData = new FormData();
            formData.append("_action", "undo-game-event");
            formData.append("logId", "log1");

            const request = {
                formData: () => Promise.resolve(formData),
            };
            const params = { eventId: "game123" };

            await action({ request, params });

            expect(gameLogActions.undoGameEvent).toHaveBeenCalledWith({
                logId: "log1",
            });
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
            });
        });
    });

    describe("Component", () => {
        it("renders gameday container", () => {
            render(<Gameday />);
            expect(screen.getByTestId("gameday-container")).toBeInTheDocument();
            expect(screen.getByText("Scoring & Stats")).toBeInTheDocument();
        });

        it("renders menu when user can score", () => {
            render(<Gameday />);
            expect(screen.getByTestId("gameday-menu")).toBeInTheDocument();
        });

        it("does not render menu when user cannot score", () => {
            require("react-router").useLoaderData.mockReturnValue({
                ...mockLoaderData,
                scorekeeperIds: ["otherUser"],
            });
            render(<Gameday />);
            expect(
                screen.queryByTestId("gameday-menu"),
            ).not.toBeInTheDocument();
        });
    });
});
