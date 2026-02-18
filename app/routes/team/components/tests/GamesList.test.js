import { DateTime } from "luxon";
import { MemoryRouter } from "react-router";
import { render, screen } from "@/utils/test-utils";

import sortByDate from "@/utils/sortByDate";

import GamesListContainer from "../GamesList";

jest.mock("@/utils/sortByDate", () => jest.fn((games) => games));

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
                <GamesListContainer seasons={mockSeasons} />
            </MemoryRouter>,
        );

        expect(screen.getByText("Current Season")).toBeInTheDocument();
        expect(screen.getByText(/Team A/)).toBeInTheDocument();
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
        expect(screen.getByText(/Team B/)).toBeInTheDocument();
    });

    it("renders no games message if no seasons", () => {
        render(
            <MemoryRouter>
                <GamesListContainer seasons={[]} />
            </MemoryRouter>,
        );
        expect(
            screen.getByText("No games currently listed."),
        ).toBeInTheDocument();
    });
});
