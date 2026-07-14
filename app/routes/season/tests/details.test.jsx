import { MemoryRouter, useOutletContext } from "react-router";
import { render, screen } from "@/utils/test-utils";

import { updateSeason } from "@/actions/seasons";
import { getSeasonById } from "@/loaders/seasons";
import { getParkById } from "@/loaders/parks";
import { mockContext } from "@/utils/mockContext";

import SeasonDetails, { loader, action } from "../details";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigation: jest.fn(() => ({ state: "idle" })),
    useOutletContext: jest.fn(() => ({ isDesktop: false })),
}));

// Mock hooks
jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(() => ({})),
}));

jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: jest.fn(() => ({
        openModal: jest.fn(),
        closeAllModals: jest.fn(),
    })),
}));

// Mock icons
jest.mock("@tabler/icons-react", () => ({
    IconBallBaseball: () => <div data-testid="icon-baseball" />,
    IconCalendarMonth: () => <div data-testid="icon-calendar-month" />,
    IconCalendarRepeat: () => <div data-testid="icon-calendar" />,
    IconCurrencyDollar: () => <div data-testid="icon-dollar" />,
    IconExternalLink: () => <div data-testid="icon-external" />,
    IconFriends: () => <div data-testid="icon-friends" />,
    IconInfoCircle: () => <div data-testid="icon-info" />,
    IconMapPin: () => <div data-testid="icon-map-pin" />,
    IconTable: () => <div data-testid="icon-table" />,
    IconMap2: () => <div data-testid="icon-map2" />,
}));

// Mock loaders and actions
jest.mock("@/loaders/seasons", () => ({
    getSeasonById: jest.fn(),
}));
jest.mock("@/loaders/parks", () => ({
    getParkById: jest.fn(),
}));
jest.mock("@/loaders/teams", () => ({
    getTeamById: jest.fn(),
}));
jest.mock("@/actions/seasons", () => ({
    updateSeason: jest.fn(),
}));
jest.mock("@/actions/games", () => ({
    createGames: jest.fn(),
    createSingleGame: jest.fn(),
}));
jest.mock("@/actions/rosterHistory", () => ({
    updateSeasonRoster: jest.fn(),
}));

// Mock global components
jest.mock("@/components/BackButton", () => ({
    __esModule: true,
    default: () => <div data-testid="back-button" />,
}));
jest.mock("@/components/GamesList", () => ({
    __esModule: true,
    default: () => <div data-testid="games-list" />,
}));
jest.mock("../components/SeasonMenu", () => ({
    __esModule: true,
    default: () => <div data-testid="season-menu" />,
}));
jest.mock("@/components/BoxScore", () => ({
    __esModule: true,
    default: () => <div data-testid="box-score" />,
}));
jest.mock("@/components/ContactSprayChart", () => ({
    __esModule: true,
    default: () => <div data-testid="spray-chart" />,
}));

describe("SeasonDetails Route", () => {
    const mockSeason = {
        $id: "season-123",
        seasonName: "Fall Season 2025",
        teamId: "team-123",
        startDate: "2025-09-01",
        endDate: "2025-11-01",
        gameDays: "Monday",
        leagueType: "Co-ed",
        teams: [{ primaryColor: "#ff0000" }],
        games: [],
    };
    const mockPark = { googleMapsURI: "http://maps.google.com" };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("loader", () => {
        it("fetches season and park data", async () => {
            getSeasonById.mockResolvedValue({
                season: { ...mockSeason, parkId: "park-123" },
            });
            getParkById.mockResolvedValue(mockPark);

            const result = await loader({
                params: { seasonId: "season-123" },
                request: {},
                context: mockContext,
            });

            expect(getSeasonById).toHaveBeenCalledWith({
                seasonId: "season-123",
                client: expect.any(Object),
            });
            expect(getParkById).toHaveBeenCalledWith({
                parkId: "park-123",
                client: expect.any(Object),
            });
            expect(result).toEqual({
                season: { ...mockSeason, parkId: "park-123" },
                park: mockPark,
            });
        });
    });

    describe("action", () => {
        it("calls updateSeason for edit-season action", async () => {
            const formData = new FormData();
            formData.append("_action", "edit-season");
            formData.append("seasonName", "New Name");

            await action({
                request: new Request("http://localhost/", {
                    method: "POST",
                    body: formData,
                }),
                params: { seasonId: "season-123" },
                context: mockContext,
            });

            expect(updateSeason).toHaveBeenCalledWith({
                values: { seasonName: "New Name" },
                seasonId: "season-123",
                client: expect.any(Object),
            });
        });

        it("fails update-season-roster if playerIds format is invalid", async () => {
            const formData = new FormData();
            formData.append("_action", "update-season-roster");
            formData.append("playerIds", "not-json");

            const result = await action({
                request: new Request("http://localhost/", {
                    method: "POST",
                    body: formData,
                }),
                params: { seasonId: "season-123" },
                context: mockContext,
            });

            expect(result).toEqual({
                success: false,
                message: "Invalid playerIds format",
            });
        });

        it("fails update-season-roster if user is not a manager", async () => {
            const { getSeasonById } = require("@/loaders/seasons");
            const { getTeamById } = require("@/loaders/teams");

            getSeasonById.mockResolvedValue({ season: mockSeason });
            getTeamById.mockResolvedValue({ managerIds: ["other-manager"] });

            const formData = new FormData();
            formData.append("_action", "update-season-roster");
            formData.append("playerIds", JSON.stringify(["player-1"]));

            const result = await action({
                request: new Request("http://localhost/", {
                    method: "POST",
                    body: formData,
                }),
                params: { seasonId: "season-123" },
                context: mockContext,
            });

            expect(result).toEqual({
                success: false,
                message:
                    "Unauthorized: You do not have permission to manage this roster.",
            });
        });

        it("performs update-season-roster successfully and uses server teamId instead of values teamId", async () => {
            const { getSeasonById } = require("@/loaders/seasons");
            const { getTeamById } = require("@/loaders/teams");
            const { updateSeasonRoster } = require("@/actions/rosterHistory");

            getSeasonById.mockResolvedValue({ season: mockSeason }); // teamId is "team-123"
            getTeamById.mockResolvedValue({ managerIds: ["user-123"] });
            updateSeasonRoster.mockResolvedValue({ success: true });

            const formData = new FormData();
            formData.append("_action", "update-season-roster");
            formData.append("playerIds", JSON.stringify(["player-1"]));
            formData.append("teamId", "malicious-tampered-team-id"); // Tampered form data!

            const result = await action({
                request: new Request("http://localhost/", {
                    method: "POST",
                    body: formData,
                }),
                params: { seasonId: "season-123" },
                context: mockContext,
            });

            expect(result).toEqual({ success: true });
            // Assert that updateSeasonRoster was called with "team-123" (from server) and NOT the tampered "malicious-tampered-team-id"!
            expect(updateSeasonRoster).toHaveBeenCalledWith({
                playerIds: ["player-1"],
                teamId: "team-123",
                seasonId: "season-123",
                client: expect.any(Object),
            });
        });
    });

    describe("meta", () => {
        it("generates correct metadata elements", () => {
            const { meta } = require("../details");
            const result = meta({
                data: {
                    season: {
                        seasonName: "Spring Season 2026",
                        teams: [{ name: "Thunder" }],
                    },
                },
            });

            expect(result).toContainEqual({
                title: "Spring Season 2026 - Thunder | RostrHQ",
            });
            expect(result).toContainEqual({
                name: "description",
                content:
                    "View stats, schedules, rosters, and details for the Spring Season 2026 season of Thunder.",
            });
        });
    });

    describe("Component", () => {
        beforeEach(() => {
            useOutletContext.mockReturnValue({
                isDesktop: false,
                isAuthenticated: true,
            });
        });

        it("renders private season page prompt if isAuthenticated is false", () => {
            useOutletContext.mockReturnValue({
                isDesktop: false,
                isAuthenticated: false,
            });
            render(
                <MemoryRouter>
                    <SeasonDetails
                        loaderData={{ season: mockSeason, park: null }}
                    />
                </MemoryRouter>,
            );

            expect(screen.getByText("Private Season Page")).toBeInTheDocument();
            expect(
                screen.getByText(
                    "You must be logged in to view this season's details.",
                ),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("link", { name: "Log In" }),
            ).toBeInTheDocument();
        });

        it("renders MobileSeasonDetails based on context", () => {
            render(
                <MemoryRouter>
                    <SeasonDetails
                        loaderData={{ season: mockSeason, park: null }}
                    />
                </MemoryRouter>,
            );

            expect(screen.getByText("Fall Season 2025")).toBeInTheDocument();
            expect(screen.getByTestId("back-button")).toBeInTheDocument();
            // GamesList is rendered twice (Upcoming and Past in Desktop)
            // In Mobile it's rendered once.
            expect(screen.getByTestId("games-list")).toBeInTheDocument();
        });

        it("calculates and passes record correctly", () => {
            const seasonWithGames = {
                ...mockSeason,
                games: [
                    { result: true, score: 10, opponentScore: 5 }, // Win
                    { result: true, score: 5, opponentScore: 10 }, // Loss
                    { result: true, score: 5, opponentScore: 5 }, // Tie
                ],
            };

            const { container } = render(
                <MemoryRouter>
                    <SeasonDetails
                        loaderData={{ season: seasonWithGames, park: null }}
                    />
                </MemoryRouter>,
            );

            expect(container.textContent).toMatch(/Record/i);
            expect(container.textContent).toMatch(/1-1-1/);
        });

        it("renders DesktopSeasonDetails based on context", () => {
            useOutletContext.mockReturnValue({ isDesktop: true });
            const { container } = render(
                <MemoryRouter>
                    <SeasonDetails
                        loaderData={{ season: mockSeason, park: null }}
                    />
                </MemoryRouter>,
            );

            expect(screen.getByText("Fall Season 2025")).toBeInTheDocument();
            expect(screen.getByTestId("back-button")).toBeInTheDocument();
            expect(container.textContent).toMatch(/Upcoming/i);
            expect(container.textContent).toMatch(/Past/i);
            expect(screen.getAllByTestId("games-list").length).toBe(2);
        });
    });
});
