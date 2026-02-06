import { screen, cleanup } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import { DateTime, Settings } from "luxon";

import GamesList from "../GamesList";

// Mock Child Component
jest.mock("@/components/GameCard", () => {
    return function MockGameCard({ opponent, gameDate }) {
        return (
            <div data-testid="game-card">
                {opponent} - {gameDate}
            </div>
        );
    };
});

describe("GamesList Component", () => {
    beforeAll(() => {
        // Freeze time to 2023-06-15 12:00:00 UTC
        const mockNow = DateTime.fromISO("2023-06-15T12:00:00.000Z").toJSDate();
        jest.useFakeTimers();
        jest.setSystemTime(mockNow);

        // Force Luxon to use UTC so "Today" comparisons work consistently regardless of test runner timezone
        Settings.defaultZone = "UTC";
    });

    afterAll(() => {
        jest.useRealTimers();
        Settings.defaultZone = "system";
    });

    afterEach(() => {
        cleanup();
    });

    const games = [
        {
            $id: "1",
            opponent: "Past Game",
            gameDate: "2023-06-10T10:00:00.000Z",
            timeZone: "UTC",
        },
        {
            $id: "2",
            opponent: "Future Game 1",
            gameDate: "2023-06-20T10:00:00.000Z",
            timeZone: "UTC",
        },
        {
            $id: "3",
            opponent: "Future Game 2",
            gameDate: "2023-06-25T10:00:00.000Z",
            timeZone: "UTC",
        },
        {
            $id: "4",
            opponent: "Today Game",
            gameDate: "2023-06-15T18:00:00.000Z",
            timeZone: "UTC",
        },
    ];

    it("renders 'No games' message when list is empty", () => {
        render(<GamesList games={[]} />);
        expect(
            screen.getByText("No games currently listed."),
        ).toBeInTheDocument();
    });

    it("renders game cards when provided", () => {
        render(<GamesList games={games} />);
        const cards = screen.getAllByTestId("game-card");
        expect(cards.length).toBe(4);
    });

    it("sorts games correctly: Today -> Future -> Past (Upcoming First)", () => {
        render(<GamesList games={games} />);
        const cards = screen.getAllByTestId("game-card");

        expect(cards[0]).toHaveTextContent(/Today/i);
        expect(cards[1]).toHaveTextContent(/Future Game 1/i);
        expect(cards[2]).toHaveTextContent(/Future Game 2/i);
        expect(cards[3]).toHaveTextContent(/Past Game/i);
    });

    it("sorts future games descending when sortOrder is 'dsc'", () => {
        render(<GamesList games={games} sortOrder="dsc" />);
        const cards = screen.getAllByTestId("game-card");

        expect(cards[0]).toHaveTextContent("Future Game 2");
        expect(cards[1]).toHaveTextContent("Future Game 1");
        expect(cards[2]).toHaveTextContent("Today Game");
        expect(cards[3]).toHaveTextContent("Past Game");
    });
});
