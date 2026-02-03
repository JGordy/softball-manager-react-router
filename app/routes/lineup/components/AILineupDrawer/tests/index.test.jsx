import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { MantineProvider } from "@mantine/core";

import * as lineupValidation from "@/utils/lineupValidation";

import AILineupDrawer from "../index";

// Mocks
jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

jest.mock("@/utils/json", () => ({
    tryParsePartialLineup: jest.fn(() => []), // Return empty partial lineup by default
}));

// Mock DrawerContainer as it might depend on portals/context not easily available
jest.mock("@/components/DrawerContainer", () => {
    return function MockDrawerContainer({ children, opened, title }) {
        if (!opened) return null;
        return (
            <div role="dialog" aria-label={title}>
                <h2>{title}</h2>
                {children}
            </div>
        );
    };
});

// Polyfill minimal stream support for the test
const mockRead = jest.fn();
const mockGetReader = jest.fn(() => ({
    read: mockRead,
    releaseLock: jest.fn(),
}));

global.fetch = jest.fn();
global.TextDecoder = require("util").TextDecoder; // Use node's TextDecoder
global.TextEncoder = require("util").TextEncoder; // Use node's TextEncoder

describe("AILineupDrawer Client Integration", () => {
    const defaultProps = {
        opened: true,
        onClose: jest.fn(),
        game: { $id: "game1" },
        team: { $id: "team1", name: "Team A" },
        players: Array(12)
            .fill(0)
            .map((_, i) => ({
                $id: `p${i}`,
                firstName: `Player`,
                lastName: `${i}`,
                availability: "accepted",
            })),
        lineupHandlers: { setState: jest.fn() },
        setHasBeenEdited: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Simulate development environment to ensure specific error messages are returned
        // instead of the generic "Failed to generate lineup" used in production.
        process.env = { ...process.env, NODE_ENV: "development" };

        // Default fetch mock setup (stream logic)
        global.fetch.mockResolvedValue({
            ok: true,
            body: {
                getReader: mockGetReader,
            },
        });
    });

    it("should display validation error when generated lineup has duplicate IDs", async () => {
        // Setup the mock to stream a complete JSON response
        const encoder = new TextEncoder();
        const jsonResponse = JSON.stringify({
            lineup: [{ $id: "p1" }, { $id: "p1" }], // Duplicate IDs
            reasoning: "Test reasoning",
        });

        mockRead
            .mockResolvedValueOnce({
                done: false,
                value: encoder.encode(jsonResponse),
            })
            .mockResolvedValueOnce({ done: true });

        // validateLineup should act like the real one or throw
        // Since we want to test that the component CATCHES the error from validation,
        // we can mock validateLineup to throw.
        // Actually, the reviewer wants us to test "properly calls these validation functions and handles validation errors".
        // Use spyOn to allow forcing an error.
        jest.spyOn(lineupValidation, "validateLineup").mockImplementation(
            () => {
                throw new Error(
                    "Generated lineup contains duplicate player IDs",
                );
            },
        );

        render(
            <MantineProvider>
                <AILineupDrawer {...defaultProps} />
            </MantineProvider>,
        );

        // Click generate
        const generateBtn = screen.getByText(/Generate Lineup/i);
        fireEvent.click(generateBtn);

        // Expect loading
        expect(
            await screen.findByText(/AI is warming up/i),
        ).toBeInTheDocument();

        // Wait for error message
        await waitFor(() => {
            expect(
                screen.getByText(
                    /Generated lineup contains duplicate player IDs/i,
                ),
            ).toBeInTheDocument();
        });

        // Verify validateLineup was called
        expect(lineupValidation.validateLineup).toHaveBeenCalled();
    });

    it("should display error when AI response is invalid JSON", async () => {
        // Stream invalid JSON
        const encoder = new TextEncoder();
        mockRead
            .mockResolvedValueOnce({
                done: false,
                value: encoder.encode("{ invalid json "),
            })
            .mockResolvedValueOnce({ done: true });

        render(
            <MantineProvider>
                <AILineupDrawer {...defaultProps} />
            </MantineProvider>,
        );

        fireEvent.click(screen.getByText(/Generate Lineup/i));

        await waitFor(() => {
            expect(
                screen.getByText(/Received invalid JSON/i),
            ).toBeInTheDocument();
        });
    });

    it("should display server side streaming error json", async () => {
        // Simulate the server sending a JSON error in the stream (as per our fix in lineup.js)
        const encoder = new TextEncoder();
        const errorPayload = JSON.stringify({
            error: "Failed to generate lineup",
            details: "Server error details",
        });

        // The component parses the valid JSON, but then checks if it has 'lineup'.
        // If the JSON is { error: ... }, line 147 `if (!aiResponse || !aiResponse.lineup)` will match
        // and throw "AI response missing lineup data.".
        // Wait, if the response is valid JSON, it parses it.
        // Our server fix sends `JSON.stringify(errorPayload)`.
        // So `aiResponse` will be `{ error: "...", details: "..." }`.
        // `aiResponse.lineup` is undefined.
        // So it throws "AI response missing lineup data."

        // This means the error message seen by user will be "AI response missing lineup data."
        // UNLESS we update index.jsx to handle this case too?
        // The reviewer's comment on lineup.js suggested:
        /*
           implementing a structured error format... or documenting that streaming failures result in generic error.
           I implemented the structured error format.
           But the client needs to check for it!
        */

        // Let's check `AILineupDrawer/index.jsx` again.
        // It does: `aiResponse = JSON.parse(resultText);`
        // Then `if (!aiResponse || !aiResponse.lineup) { throw new Error("AI response missing lineup data."); }`

        // So currently my client change doesn't explicitly look for `aiResponse.error`.
        // I should probably update `index.jsx` to look for `aiResponse.error` too.

        // Let's write the test assuming I will fix that too.

        mockRead
            .mockResolvedValueOnce({
                done: false,
                value: encoder.encode(errorPayload),
            })
            .mockResolvedValueOnce({ done: true });

        render(
            <MantineProvider>
                <AILineupDrawer {...defaultProps} />
            </MantineProvider>,
        );

        fireEvent.click(screen.getByText(/Generate Lineup/i));

        // If I code it right, it should show the actual error
        await waitFor(() => {
            expect(
                screen.getByText(/Failed to generate lineup/i),
            ).toBeInTheDocument();
            // Or "Server error details" if we expose it
        });
    });
});
