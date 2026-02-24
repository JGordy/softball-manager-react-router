import { render, screen } from "@/utils/test-utils";
import { DateTime } from "luxon";

import GameCalendarRow from "../GameCalendarRow";

// Mock scrollIntoView as it's not supported in JSDOM
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe("GameCalendarRow Component", () => {
    const mockGames = [
        {
            $id: "game1",
            gameDate: DateTime.local().minus({ days: 1 }).toISO(),
            result: "won",
        },
        {
            $id: "game2",
            gameDate: DateTime.local().toISO(), // today
        },
        {
            $id: "game3",
            gameDate: DateTime.local().plus({ days: 1 }).toISO(),
            result: "lost",
        },
    ];

    it("renders game dates correctly", () => {
        render(<GameCalendarRow games={mockGames} />);

        const yesterday = DateTime.local().minus({ days: 1 });
        const today = DateTime.local();
        const tomorrow = DateTime.local().plus({ days: 1 });

        expect(screen.getByText(yesterday.toFormat("M/d"))).toBeInTheDocument();
        expect(screen.getByText(today.toFormat("M/d"))).toBeInTheDocument();
        expect(screen.getByText(tomorrow.toFormat("M/d"))).toBeInTheDocument();
    });

    it("renders result labels (W, L) when present", () => {
        render(<GameCalendarRow games={mockGames} />);

        expect(screen.getByText("W")).toBeInTheDocument();
        expect(screen.getByText("L")).toBeInTheDocument();
    });

    it("returns null when no games are provided", () => {
        const { container } = render(<GameCalendarRow games={[]} />);
        // When using MantineProvider, container might have style tags,
        // so we check for the absence of the component's root elements
        expect(container.querySelector("div[style*='margin-top']")).toBeNull();
    });
});
