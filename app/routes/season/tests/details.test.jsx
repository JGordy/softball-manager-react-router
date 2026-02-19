import { MemoryRouter } from "react-router";
import { render, screen } from "@/utils/test-utils";

import { updateSeason } from "@/actions/seasons";
import { getSeasonById } from "@/loaders/seasons";
import { getParkById } from "@/loaders/parks";

import SeasonDetails, { loader, action } from "../details";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigation: jest.fn(() => ({ state: "idle" })),
}));

// Mock hooks
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
    IconCalendarRepeat: () => <div data-testid="icon-calendar" />,
    IconCurrencyDollar: () => <div data-testid="icon-dollar" />,
    IconExternalLink: () => <div data-testid="icon-external" />,
    IconFriends: () => <div data-testid="icon-friends" />,
    IconInfoCircle: () => <div data-testid="icon-info" />,
    IconMapPin: () => <div data-testid="icon-map-pin" />,
}));

// Mock loaders and actions
jest.mock("@/loaders/seasons", () => ({
    getSeasonById: jest.fn(),
}));
jest.mock("@/loaders/parks", () => ({
    getParkById: jest.fn(),
}));
jest.mock("@/actions/seasons", () => ({
    updateSeason: jest.fn(),
}));
jest.mock("@/actions/games", () => ({
    createGames: jest.fn(),
    createSingleGame: jest.fn(),
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

            const result = await loader({ params: { seasonId: "season-123" } });

            expect(getSeasonById).toHaveBeenCalledWith({
                seasonId: "season-123",
            });
            expect(getParkById).toHaveBeenCalledWith({ parkId: "park-123" });
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
            });

            expect(updateSeason).toHaveBeenCalledWith({
                values: { seasonName: "New Name" },
                seasonId: "season-123",
            });
        });
    });

    describe("Component", () => {
        it("renders season details correctly", () => {
            render(
                <MemoryRouter>
                    <SeasonDetails
                        loaderData={{ season: mockSeason, park: null }}
                    />
                </MemoryRouter>,
            );

            expect(screen.getByText("Fall Season 2025")).toBeInTheDocument();
            expect(screen.getByTestId("back-button")).toBeInTheDocument();
        });

        it("calculates and displays record correctly", () => {
            const seasonWithGames = {
                ...mockSeason,
                games: [
                    { result: true, score: 10, opponentScore: 5 }, // Win
                    { result: true, score: 5, opponentScore: 10 }, // Loss
                    { result: true, score: 5, opponentScore: 5 }, // Tie
                ],
            };

            render(
                <MemoryRouter>
                    <SeasonDetails
                        loaderData={{ season: seasonWithGames, park: null }}
                    />
                </MemoryRouter>,
            );

            expect(screen.getByText("Record 1-1-1")).toBeInTheDocument();
        });
    });
});
