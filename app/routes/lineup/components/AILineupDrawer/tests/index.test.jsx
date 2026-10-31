import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { MantineProvider } from "@mantine/core";

import * as lineupValidation from "@/utils/lineupValidation";
import * as jsonUtils from "@/utils/json";
import * as Sentry from "@sentry/react-router";

import AILineupDrawer from "../index";

// Mocks
jest.mock("@sentry/react-router", () => ({
    captureException: jest.fn(),
    addBreadcrumb: jest.fn(),
}));

jest.mock("react-router", () => ({
    useOutletContext: jest.fn(() => ({ isDesktop: false })),
}));

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
    cancel: jest.fn(),
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
        // Verify Sentry captured the exception
        expect(Sentry.captureException).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                tags: expect.objectContaining({
                    feature: "ai-lineup",
                    phase: "client_generation",
                }),
            }),
        );
    });

    it("should display informative error in production without falling back to generic message", async () => {
        process.env = { ...process.env, NODE_ENV: "production" };
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 429,
            text: jest.fn().mockResolvedValue(
                JSON.stringify({
                    error: "Failed to generate lineup: AI service rate limit reached. Please wait a minute and try again.",
                }),
            ),
        });

        render(
            <MantineProvider>
                <AILineupDrawer {...defaultProps} />
            </MantineProvider>,
        );

        fireEvent.click(screen.getByText(/Generate Lineup/i));

        await waitFor(() => {
            expect(
                screen.getByText(
                    /The AI service is busy or rate-limited\. Please wait a minute and try again/i,
                ),
            ).toBeInTheDocument();
        });
        expect(Sentry.captureException).toHaveBeenCalled();
    });

    it("should never leak internal database IDs or stack traces to UI in production", async () => {
        process.env = { ...process.env, NODE_ENV: "production" };
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: jest.fn().mockResolvedValue(
                JSON.stringify({
                    error: "Invalid positions array for player with id 64f1a2b3c4d5e6f7a8b9",
                    details:
                        "Error at Database.listDocuments (/internal/server.js:42:15)",
                }),
            ),
        });

        render(
            <MantineProvider>
                <AILineupDrawer {...defaultProps} />
            </MantineProvider>,
        );

        fireEvent.click(screen.getByText(/Generate Lineup/i));

        await waitFor(() => {
            // Safe message shown
            expect(
                screen.getByText(
                    /The AI was unable to create a valid lineup for the current roster\. Please try again/i,
                ),
            ).toBeInTheDocument();
        });

        // Must NOT leak database ID or stack trace
        expect(
            screen.queryByText(/64f1a2b3c4d5e6f7a8b9/i),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText(/internal\/server\.js/i),
        ).not.toBeInTheDocument();
        expect(Sentry.captureException).toHaveBeenCalled();
    });

    it("should salvage lineup when JSON parse fails but partial lineup is complete", async () => {
        const encoder = new TextEncoder();
        // Cut-off JSON (e.g. truncated during reasoning)
        const truncatedJson =
            '{"lineup": [{"$id": "p0", "firstName": "Player", "lastName": "0", "gender": "male", "positions": ["P","P","P","P","P","P","P"]}], "reasoning": "Incomplete...';

        mockRead
            .mockResolvedValueOnce({
                done: false,
                value: encoder.encode(truncatedJson),
            })
            .mockResolvedValueOnce({ done: true });

        // tryParsePartialLineup successfully recovers the player objects
        jsonUtils.tryParsePartialLineup.mockReturnValue([
            {
                $id: "p0",
                firstName: "Player",
                lastName: "0",
                gender: "male",
                positions: Array(7).fill("P"),
            },
        ]);

        render(
            <MantineProvider>
                <AILineupDrawer {...defaultProps} />
            </MantineProvider>,
        );

        fireEvent.click(screen.getByText(/Generate Lineup/i));

        // It should successfully show results view instead of throwing error
        await waitFor(() => {
            expect(screen.queryByText(/Error/i)).not.toBeInTheDocument();
        });
    });

    it("should display error when AI response is invalid JSON and cannot be salvaged", async () => {
        // Stream invalid JSON
        const encoder = new TextEncoder();
        mockRead
            .mockResolvedValueOnce({
                done: false,
                value: encoder.encode("{ invalid json "),
            })
            .mockResolvedValueOnce({ done: true });

        jsonUtils.tryParsePartialLineup.mockReturnValue([]);

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
        // Simulate the AI endpoint returning a structured error payload
        // (e.g. `{ error: "...", details: "..." }`) instead of a valid lineup
        // and verify that the user sees the appropriate failure message.
        const encoder = new TextEncoder();
        const errorPayload = JSON.stringify({
            error: "Failed to generate lineup",
            details: "Server error details",
        });

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

    describe("notEnoughPlayers", () => {
        const fewerPlayersProps = {
            ...defaultProps,
            players: Array(4)
                .fill(0)
                .map((_, i) => ({
                    $id: `p${i}`,
                    firstName: "Player",
                    lastName: `${i}`,
                    availability: "accepted",
                })),
        };

        it("disables the Generate Lineup button when fewer than 9 players are available", () => {
            render(
                <MantineProvider>
                    <AILineupDrawer {...fewerPlayersProps} />
                </MantineProvider>,
            );
            expect(
                screen.getByRole("button", { name: /Not Enough Players/i }),
            ).toBeDisabled();
        });

        it("shows the not enough players alert when fewer than 9 players are available", () => {
            render(
                <MantineProvider>
                    <AILineupDrawer {...fewerPlayersProps} />
                </MantineProvider>,
            );
            expect(
                screen.getByText(
                    /A minimum of 9 available players is required/i,
                ),
            ).toBeInTheDocument();
        });

        it("enables the Generate Lineup button when 9 or more players are available", () => {
            render(
                <MantineProvider>
                    <AILineupDrawer {...defaultProps} />
                </MantineProvider>,
            );
            expect(
                screen.getByRole("button", { name: /Generate Lineup/i }),
            ).not.toBeDisabled();
        });

        it("does not show the not enough players alert when 9 or more players are available", () => {
            render(
                <MantineProvider>
                    <AILineupDrawer {...defaultProps} />
                </MantineProvider>,
            );
            expect(
                screen.queryByText(
                    /A minimum of 9 available players is required/i,
                ),
            ).not.toBeInTheDocument();
        });
    });
});
