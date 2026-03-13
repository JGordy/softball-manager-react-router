import { DateTime } from "luxon";
import { MemoryRouter } from "react-router";
import { render, screen } from "@/utils/test-utils";

import sortByDate from "@/utils/sortByDate";

import GamesListContainer from "../GamesList";

jest.mock("@/utils/sortByDate", () => jest.fn((games) => games));
jest.mock("@/components/GamesList", () => ({
    __esModule: true,
    default: ({ games, primaryColor }) => (
        <div data-testid="shared-games-list" data-primarycolor={primaryColor}>
            {!games || games.length === 0
                ? "No games currently listed."
                : "Games List Rendering"}
        </div>
    ),
}));

describe("GamesListContainer Component", () => {
    const today = DateTime.local();
    const timeZone = today.zoneName;
    const mockSeasons = [
        {
            $id: "s1",
            seasonName: "Current Season",
            startDate: today.minus({ days: 10 }).toISO(),
            endDate: today.plus({ days: 10 }).toISO(),
            games: [
                {
                    $id: "g1",
                    gameDate: today.toISO(),
                    opponent: "Team A",
                    timeZone,
                },
            ],
        },
        {
            $id: "s2",
            seasonName: "Past Season",
            startDate: today.minus({ days: 30 }).toISO(),
            endDate: today.minus({ days: 20 }).toISO(),
            games: [
                {
                    $id: "g2",
                    gameDate: today.minus({ days: 25 }).toISO(),
                    opponent: "Team B",
                    timeZone,
                },
            ],
        },
    ];

    it("renders the current season and its games", () => {
        render(
            <MemoryRouter>
                <GamesListContainer
                    seasons={mockSeasons}
                    primaryColor="#ff0000"
                />
            </MemoryRouter>,
        );

        expect(screen.getByText("Current Season")).toBeInTheDocument();
        const gamesList = screen.getByTestId("shared-games-list");
        expect(gamesList).toBeInTheDocument();
        expect(gamesList).toHaveAttribute("data-primarycolor", "#ff0000");
        expect(sortByDate).toHaveBeenCalled();
    });

    it("falls back to past season if no current season", () => {
        const pastOnly = [mockSeasons[1]];
        render(
            <MemoryRouter>
                <GamesListContainer seasons={pastOnly} />
            </MemoryRouter>,
        );

        expect(screen.getByText("Past Season")).toBeInTheDocument();
        expect(screen.getByTestId("shared-games-list")).toBeInTheDocument();
    });

    it("renders no games message if no seasons", () => {
        render(
            <MemoryRouter>
                <GamesListContainer seasons={[]} />
            </MemoryRouter>,
        );
        // GamesList shared component will show this when games.length is 0
        // But since we mocked it, it will render the mock.
        // Wait, the mock I wrote renders regardless of games length.
        // I should update the mock to reflect games length.
        expect(
            screen.getByText("No games currently listed."),
        ).toBeInTheDocument();
    });
});
