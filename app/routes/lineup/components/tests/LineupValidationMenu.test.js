import { render, screen, fireEvent } from "@/utils/test-utils";
import LineupValidationMenu from "../LineupValidationMenu";

// Polyfill scrollIntoView for Mantine ScrollArea/Menu interactions
window.HTMLElement.prototype.scrollIntoView = function () {};

describe("LineupValidationMenu Component", () => {
    it("renders explicitly without errors", async () => {
        const validationResults = {
            battingErrors: [],
            fieldingErrors: {},
        };

        render(<LineupValidationMenu validationResults={validationResults} />);

        // Find the button (trigger)
        const trigger = screen.getByRole("button", {
            name: /Lineup Validation/i,
        });
        expect(trigger).toBeInTheDocument();

        // The dropdown content is not mounted until opened, so it should not exist yet.
        expect(screen.queryByText("No issues found")).toBeNull();

        fireEvent.click(trigger);

        // Once opened, the success state should be rendered in the DOM
        expect(await screen.findByText("No issues found")).toBeInTheDocument();
    });

    it("renders error counts and details correctly", async () => {
        const validationResults = {
            battingErrors: [
                {
                    playerName: "John Doe",
                    count: 4,
                    message: "is the 4th consecutive male batter.",
                },
            ],
            fieldingErrors: {
                inning1: {
                    duplicates: [
                        { position: "P", playerNames: ["Alice", "Bob"] },
                    ],
                    missing: ["Charlie"],
                },
            },
        };

        render(<LineupValidationMenu validationResults={validationResults} />);

        // The indicator badge should show the count "3"
        expect(await screen.findByText("3")).toBeInTheDocument();

        // Open the menu to reveal content
        const trigger = screen.getByRole("button", {
            name: /Lineup Validation/i,
        });

        fireEvent.click(trigger);

        expect(await screen.findByText("Batting Order")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        // Match partial text for the complex message (portion rendered outside <Text span>)
        expect(
            screen.getByText((content) =>
                content.includes("4th consecutive male batter"),
            ),
        ).toBeInTheDocument();

        expect(screen.getByText("Fielding Chart")).toBeInTheDocument();
        // "Inning 1" appears twice: once for duplicate error, once for missing error
        expect(screen.getAllByText(/Inning 1/)).toHaveLength(2);

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();

        // Match exact text "P" to avoid matching inside "Position" or other words if any
        expect(screen.getByText("P", { selector: "span" })).toBeInTheDocument();

        expect(screen.getByText("Charlie")).toBeInTheDocument();
    });
});
