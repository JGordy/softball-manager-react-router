import { render, screen } from "@/utils/test-utils";
import { MemoryRouter } from "react-router";
import DesktopSeasonDetails from "../DesktopSeasonDetails";

// Mock icons
jest.mock("@tabler/icons-react", () => ({
    IconBallBaseball: () => <div data-testid="icon-baseball" />,
    IconCalendarMonth: () => <div data-testid="icon-calendar" />,
    IconInfoCircle: () => <div data-testid="icon-info" />,
}));

// Mock global components
jest.mock("@/components/BackButton", () => ({
    __esModule: true,
    default: () => <div data-testid="back-button" />,
}));
jest.mock("../SeasonMenu", () => ({
    __esModule: true,
    default: () => <div data-testid="season-menu" />,
}));
jest.mock("@/utils/getGames", () => ({
    splitGames: jest.fn(() => ({
        futureGames: [{ $id: "upcoming1", gameDate: "2026-04-01T12:00:00Z" }],
        pastGames: [{ $id: "past1", gameDate: "2026-03-01T12:00:00Z" }],
    })),
}));

describe("DesktopSeasonDetails", () => {
    const mockSeason = {
        $id: "season-123",
        seasonName: "Fall Season 2025",
        teamId: "team-123",
        startDate: "2025-09-01T00:00:00Z",
        endDate: "2025-11-01T00:00:00Z",
        gameDays: "Monday",
        leagueType: "Co-ed",
        games: [
            {
                $id: "game1",
                gameDate: new Date(Date.now() + 86400000).toISOString(),
            }, // Tomorrow
            {
                $id: "game2",
                gameDate: new Date(Date.now() - 86400000).toISOString(),
            }, // Yesterday
        ],
    };

    const mockDetailsConfig = [];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders desktop view correctly with upcoming/past tabs", () => {
        const { container } = render(
            <MemoryRouter>
                <DesktopSeasonDetails
                    season={mockSeason}
                    primaryColor="lime"
                    record={{ wins: 1, losses: 0, ties: 0 }}
                    detailsConfig={mockDetailsConfig}
                />
            </MemoryRouter>,
        );

        expect(screen.getByText("Fall Season 2025")).toBeInTheDocument();
        expect(screen.getByTestId("back-button")).toBeInTheDocument();
        expect(container.textContent).toMatch(/Upcoming/i);
        expect(container.textContent).toMatch(/Past/i);
        expect(container.textContent).toMatch(/Record/i);
    });
});
