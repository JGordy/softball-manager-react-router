import { render, screen } from "@/utils/test-utils";
import { MemoryRouter } from "react-router";
import MobileSeasonDetails from "../MobileSeasonDetails";

// Mock icons
jest.mock("@tabler/icons-react", () => ({
    IconBallBaseball: () => <div data-testid="icon-baseball" />,
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
jest.mock("@/components/GamesList", () => ({
    __esModule: true,
    default: () => <div data-testid="games-list" />,
}));

describe("MobileSeasonDetails", () => {
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
            },
            {
                $id: "game2",
                gameDate: new Date(Date.now() - 86400000).toISOString(),
            },
        ],
    };

    const mockDetailsConfig = [];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders mobile view correctly", () => {
        const { container } = render(
            <MemoryRouter>
                <MobileSeasonDetails
                    season={mockSeason}
                    primaryColor="lime"
                    record={{ wins: 1, losses: 0, ties: 0 }}
                    detailsConfig={mockDetailsConfig}
                />
            </MemoryRouter>,
        );

        expect(screen.getByText("Fall Season 2025")).toBeInTheDocument();
        expect(screen.getByTestId("back-button")).toBeInTheDocument();
        expect(container.textContent).toMatch(/Details/i);
        expect(container.textContent).toMatch(/Games/i);
        expect(container.textContent).toMatch(/Record/i);
    });
});
