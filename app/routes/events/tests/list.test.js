import { useComputedColorScheme } from "@mantine/core";

import { render, screen, fireEvent, waitFor } from "@/utils/test-utils";

import * as teamsLoaders from "@/loaders/teams";
import * as getGamesUtils from "@/utils/getGames";

import EventsList, { loader } from "../list";

jest.mock("@mantine/core", () => {
    const actual = jest.requireActual("@mantine/core");
    return {
        ...actual,
        useComputedColorScheme: jest.fn(),
    };
});

jest.mock("@/components/UserHeader", () => ({ children, subText }) => (
    <div data-testid="user-header">
        <span>{subText}</span>
        {children}
    </div>
));

jest.mock("@/components/GamesList", () => ({ games }) => (
    <div data-testid="games-list">
        {games?.map((g) => (
            <div key={g.id}>{g.name}</div>
        ))}
    </div>
));

jest.mock("@/loaders/teams");
jest.mock("@/utils/getGames");

describe("EventsList Route", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useComputedColorScheme.mockReturnValue("light");
        getGamesUtils.default.mockReturnValue({
            futureGames: [],
            pastGames: [],
        });
    });

    const mockLoaderData = {
        userId: "user1",
        teams: {
            managing: [{ $id: "team1", name: "Team 1" }],
            playing: [{ $id: "team2", name: "Team 2" }],
        },
    };

    describe("Loader", () => {
        it("calls getUserTeams and returns formatted data", async () => {
            teamsLoaders.getUserTeams.mockResolvedValue({
                managing: ["t1"],
                playing: ["t2"],
                userId: "u1",
            });

            const request = { url: "http://test.com" };
            const result = await loader({ request });

            expect(teamsLoaders.getUserTeams).toHaveBeenCalledWith({ request });
            expect(result).toEqual({
                userId: "u1",
                teams: { managing: ["t1"], playing: ["t2"] },
            });
        });
    });

    describe("Component", () => {
        it("renders with default 'upcoming' tab if future games exist", () => {
            getGamesUtils.default.mockReturnValue({
                futureGames: [{ id: "g1", name: "Game 1" }],
                pastGames: [],
            });

            render(<EventsList loaderData={mockLoaderData} />);
            expect(screen.getByText("Game 1")).toBeInTheDocument();
        });

        it("renders with default 'past' tab if no future games", () => {
            getGamesUtils.default.mockReturnValue({
                futureGames: [],
                pastGames: [{ id: "g2", name: "Game 2" }],
            });

            render(<EventsList loaderData={mockLoaderData} />);
            expect(screen.getByText("Game 2")).toBeInTheDocument();
        });

        it("renders filter menu trigger (ActionIcon via UserHeader children)", () => {
            render(<EventsList loaderData={mockLoaderData} />);
            // The ActionIcon has aria-label="Filter Games".
            expect(screen.getByLabelText("Filter Games")).toBeInTheDocument();
        });

        it("filters games when a team is selected", async () => {
            const games = [
                { id: "g1", name: "Game 1", teamId: "team1" },
                { id: "g2", name: "Game 2", teamId: "team2" },
            ];
            getGamesUtils.default.mockReturnValue({
                futureGames: games,
                pastGames: [],
            });

            render(<EventsList loaderData={mockLoaderData} />);

            // Initial render passed all games (filterId = 'all')
            // GamesList mock prints names
            expect(screen.getByText("Game 1")).toBeInTheDocument();
            expect(screen.getByText("Game 2")).toBeInTheDocument();

            // Open menu (click action icon)
            fireEvent.click(screen.getByLabelText("Filter Games"));

            const teamOneOption = await screen.findByRole("radio", {
                name: "Team 1",
            });
            fireEvent.click(teamOneOption);

            // Now only Game 1 should be visible
            expect(screen.getByText("Game 1")).toBeInTheDocument();
            expect(screen.queryByText("Game 2")).not.toBeInTheDocument();
        });

        it("toggles filter menu visibility", async () => {
            render(<EventsList loaderData={mockLoaderData} />);

            const trigger = screen.getByLabelText("Filter Games");

            fireEvent.click(trigger);
            await screen.findByText("Filter Games by Team");

            fireEvent.click(trigger);

            await waitFor(() =>
                expect(
                    screen.queryByText("Filter Games by Team"),
                ).not.toBeInTheDocument(),
            );
        });
    });
});
