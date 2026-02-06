import { screen, cleanup } from "@testing-library/react";
import { DateTime } from "luxon";
import { MemoryRouter } from "react-router";

import { render } from "@/utils/test-utils";
import GameCard from "../GameCard";

describe("GameCard Component", () => {
    beforeAll(() => {
        // Freeze time to 2023-06-15 12:00:00 UTC
        const mockNow = DateTime.fromISO("2023-06-15T12:00:00.000Z").toJSDate();
        jest.useFakeTimers();
        jest.setSystemTime(mockNow);
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    afterEach(() => {
        cleanup();
    });

    const baseGame = {
        $id: "game1",
        gameDate: "2023-06-15T18:00:00.000Z", // Same day, 6 hours later
        opponent: "Rival Team",
        parkName: "Central Park",
        field: "Field 1",
        timeZone: "UTC",
    };

    const renderWithRouter = (ui) => {
        return render(ui, {
            wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
        });
    };

    it("renders basic game details", () => {
        renderWithRouter(<GameCard {...baseGame} />);
        expect(screen.getByText(/@ Rival Team/)).toBeInTheDocument();
    });

    it("shows 'hours away' for same-day future games", () => {
        renderWithRouter(<GameCard {...baseGame} />);
        expect(screen.getByText(/6 hours away!/)).toBeInTheDocument();
    });

    it("shows '1 hour away' correctly or handles same day logic", () => {
        const game = { ...baseGame, gameDate: "2023-06-15T12:45:00.000Z" };
        renderWithRouter(<GameCard {...game} />);
        expect(screen.getByText(/1 hour away!/)).toBeInTheDocument();
    });

    it("renders past game result", () => {
        const pastGame = {
            ...baseGame,
            gameDate: "2023-06-14T10:00:00.000Z", // Yesterday
            result: "won",
            score: 10,
            opponentScore: 5,
        };
        renderWithRouter(<GameCard {...pastGame} />);
        expect(screen.getByText("WON 10-5")).toBeInTheDocument();
    });

    it("renders pending results message for past game without scores", () => {
        const pastGame = {
            ...baseGame,
            gameDate: "2023-06-14T10:00:00.000Z",
            result: null,
        };
        renderWithRouter(<GameCard {...pastGame} />);
        expect(screen.getByText("Results Pending")).toBeInTheDocument();
    });

    it("shows 'days away' for future games", () => {
        const futureGame = {
            ...baseGame,
            gameDate: "2023-06-20T12:00:00.000Z", // 5 days later
        };
        renderWithRouter(<GameCard {...futureGame} />);
        expect(screen.getByText(/5 days away!/)).toBeInTheDocument();
    });
});
