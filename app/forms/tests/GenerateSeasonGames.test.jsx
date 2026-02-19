import { render, screen, fireEvent, waitFor } from "@/utils/test-utils";
import { getUserTimeZone } from "@/utils/dateTime";

import GenerateSeasonGames from "../GenerateSeasonGames";

const mockSubmit = jest.fn();
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useSubmit: () => mockSubmit,
    Form: ({ children, onSubmit, ...props }) => (
        <form onSubmit={onSubmit} {...props}>
            {children}
        </form>
    ),
}));

jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: () => ({
        closeAllModals: jest.fn(),
        openModal: jest.fn(),
    }),
}));

jest.mock("@/utils/dateTime", () => ({
    ...jest.requireActual("@/utils/dateTime"),
    getUserTimeZone: jest.fn(),
}));

describe("GenerateSeasonGames", () => {
    const mockSeason = {
        $id: "season123",
        startDate: "2025-05-01T00:00:00.000Z", // Thursday
        endDate: "2025-05-15T00:00:00.000Z", // Thursday
        gameDays: "Thursday",
        teamId: "team456",
    };

    beforeEach(() => {
        getUserTimeZone.mockReturnValue("UTC");
    });

    it("renders initial state correctly", () => {
        render(<GenerateSeasonGames season={mockSeason} />);

        // Use more specific check for one of the dates
        expect(screen.getAllByText(/2025/i).length).toBeGreaterThan(0);
        expect(
            screen.getByRole("button", { name: /generate games/i }),
        ).toBeInTheDocument();
    });

    it("generates games when clicking the generate button", async () => {
        render(<GenerateSeasonGames season={mockSeason} />);

        const generateButton = screen.getByRole("button", {
            name: /generate games/i,
        });
        fireEvent.click(generateButton);

        // Wait for the "Save Games" button to appear (indicating generation is complete)
        // or wait for the "Date" header in the GamesTable.
        expect(await screen.findByText("Date")).toBeInTheDocument();

        // The summary uses toLocaleString() which is usually M/D/YYYY
        // The table uses DATE_MED which is "May 1, 2025"
        expect(screen.getAllByText(/May 1, 2025/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/May 8, 2025/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/May 15, 2025/i).length).toBeGreaterThan(0);
    });

    it("clears generated games when clicking clear", async () => {
        render(<GenerateSeasonGames season={mockSeason} />);

        fireEvent.click(
            screen.getByRole("button", { name: /generate games/i }),
        );

        // Wait for games to be generated
        const clearButton = await screen.findByRole("button", {
            name: /clear games/i,
        });
        fireEvent.click(clearButton);

        // Date header from GamesTable should disappear
        await waitFor(() => {
            expect(screen.queryByText("Date")).not.toBeInTheDocument();
        });
    });

    it("renders submit button after generating games", async () => {
        render(<GenerateSeasonGames season={mockSeason} />);

        fireEvent.click(
            screen.getByRole("button", { name: /generate games/i }),
        );

        await waitFor(
            () => {
                expect(
                    screen.getByRole("button", { name: /save games/i }),
                ).toBeInTheDocument();
            },
            { timeout: 2000 },
        );
    });

    it("submits the form with generated games", async () => {
        render(<GenerateSeasonGames season={mockSeason} />);

        fireEvent.click(
            screen.getByRole("button", { name: /generate games/i }),
        );

        const submitButton = await screen.findByRole("button", {
            name: /save games/i,
        });
        fireEvent.click(submitButton);

        expect(mockSubmit).toHaveBeenCalledWith(expect.any(FormData), {
            action: undefined,
            method: "post",
        });

        const formData = mockSubmit.mock.calls[0][0];
        const games = JSON.parse(formData.get("games"));
        expect(games.length).toBe(3); // May 1, 8, 15
        expect(formData.get("_action")).toBe("add-games");
    });
});
