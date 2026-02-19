import { DateTime } from "luxon";
import { render, screen, fireEvent } from "@/utils/test-utils";

import useModal from "@/hooks/useModal";

import SeasonList from "../SeasonList";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.mock("@/forms/AddSeason", () => () => (
    <div data-testid="add-season-form" />
));
jest.mock("@/hooks/useModal");

describe("SeasonList Component", () => {
    const today = DateTime.local();
    const mockSeasons = [
        {
            $id: "s1",
            seasonName: "Current Season",
            startDate: today.minus({ days: 10 }).toISO(),
            endDate: today.plus({ days: 10 }).toISO(),
            games: [],
        },
        {
            $id: "s2",
            seasonName: "Upcoming Season",
            startDate: today.plus({ days: 20 }).toISO(),
            endDate: today.plus({ days: 40 }).toISO(),
        },
    ];
    const mockOpenModal = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useModal.mockReturnValue({ openModal: mockOpenModal });
    });

    it("renders list of seasons", () => {
        render(<SeasonList seasons={mockSeasons} teamId="t1" />);
        expect(screen.getByText("Current Season")).toBeInTheDocument();
        expect(screen.getByText("Upcoming Season")).toBeInTheDocument();
    });

    it("shows add season button for managers when no seasons", () => {
        render(<SeasonList seasons={[]} teamId="t1" managerView={true} />);
        expect(screen.getByText("Add New Season")).toBeInTheDocument();
    });

    it("opens add season modal when button is clicked", () => {
        render(<SeasonList seasons={[]} teamId="t1" managerView={true} />);
        fireEvent.click(screen.getByText("Add New Season"));
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Add a New Season",
            }),
        );
    });

    it("links to correct season page", () => {
        render(<SeasonList seasons={mockSeasons} teamId="t1" />);
        // Use a more specific query to avoid multiple matches if needed, but text should be fine
        const link = screen.getByRole("link", { name: /Current Season/ });
        expect(link).toHaveAttribute("href", "/season/s1");
    });

    it("displays next game info if in progress and game scheduled", () => {
        const seasonWithGame = [
            {
                ...mockSeasons[0],
                games: [
                    {
                        $id: "g1",
                        gameDate: today.plus({ days: 2 }).toISO(),
                        opponent: "Rivals",
                        isHomeGame: true,
                    },
                ],
            },
        ];
        render(<SeasonList seasons={seasonWithGame} teamId="t1" />);
        expect(
            screen.getByText(/Next game vs Rivals in 2 days!/),
        ).toBeInTheDocument();
    });
});
