import { render, screen, fireEvent } from "@/utils/test-utils";
import GuestPlayersDrawer from "../GuestPlayersDrawer";

const mockOpenModal = jest.fn();
jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: () => ({
        openModal: (...args) => mockOpenModal(...args),
        closeAllModals: jest.fn(),
    }),
}));

describe("GuestPlayersDrawer", () => {
    const mockGuests = [
        {
            $id: "guest-1",
            firstName: "Sam",
            lastName: "Miller",
            gender: "Male",
            gameCount: 3,
            recentGame: { opponent: "Dragons", date: "2026-06-01" },
            stats: { ab: 6, hits: 3, avg: ".500" },
        },
    ];

    it("renders empty state when no guest players exist", () => {
        render(
            <GuestPlayersDrawer
                opened={true}
                onClose={jest.fn()}
                guestPlayers={[]}
                teamId="team-1"
            />,
        );

        expect(screen.getByText("No Guest Players Yet")).toBeInTheDocument();
    });

    it("renders list of guest players with stats and opens convert modal on click", () => {
        const mockOnClose = jest.fn();
        render(
            <GuestPlayersDrawer
                opened={true}
                onClose={mockOnClose}
                guestPlayers={mockGuests}
                teamId="team-1"
            />,
        );

        expect(screen.getByText("Sam Miller")).toBeInTheDocument();
        expect(screen.getByText(/3 games/i)).toBeInTheDocument();
        expect(screen.getByText(/3\/6 \(.500 AVG\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Last played/i)).toBeInTheDocument();

        const convertButton = screen.getByRole("button", { name: /Convert/i });
        expect(convertButton).toBeInTheDocument();

        fireEvent.click(convertButton);
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Convert Sam Miller to Team Member",
            }),
        );
    });

    it("renders multiple guest players in separate cards cleanly sorted with most recent on top", () => {
        const multipleGuests = [
            ...mockGuests, // date: 2026-06-01
            {
                $id: "guest-2",
                firstName: "David (Guest)",
                lastName: "",
                gender: "Male",
                gameCount: 1,
                recentGame: { opponent: "Grant Park", date: "2026-06-08" },
                stats: { ab: 5, hits: 4, avg: ".800" },
            },
        ];

        render(
            <GuestPlayersDrawer
                opened={true}
                onClose={jest.fn()}
                guestPlayers={multipleGuests}
                teamId="team-1"
                buttonColor="#991b1b"
            />,
        );

        // David (2026-06-08) played more recently than Sam (2026-06-01), so David is first
        const cards = screen.getAllByText(/David \(Guest\)|Sam Miller/);
        expect(cards[0]).toHaveTextContent("David (Guest)");
        expect(cards[1]).toHaveTextContent("Sam Miller");

        const convertButtons = screen.getAllByRole("button", {
            name: /Convert/i,
        });
        expect(convertButtons).toHaveLength(2);
    });
});
