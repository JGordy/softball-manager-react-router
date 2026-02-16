import { render, screen, waitFor } from "@/utils/test-utils";

import WinnerDisplay from "../WinnerDisplay";

// Mock canvas-confetti
jest.mock("canvas-confetti", () => ({
    __esModule: true,
    default: {
        create: jest.fn(() => jest.fn()),
    },
}));
import confetti from "canvas-confetti";

// Mock icons
jest.mock("@tabler/icons-react", () => ({
    IconTrophyFilled: () => <div data-testid="icon-trophy" />,
}));

// Mock user avatar - use relative path or full alias as used in file
jest.mock("@/components/UserAvatar", () => ({ user }) => (
    <div data-testid="user-avatar">{user.firstName}</div>
));

describe("WinnerDisplay", () => {
    const mockUser = { $id: "user1", firstName: "Test", lastName: "User" };
    const mockGame = { $id: "game1" };
    const mockTeam = { $id: "team1", primaryColor: "blue" };
    const mockPlayers = [
        { $id: "p1", firstName: "Alice", lastName: "A" },
        { $id: "p2", firstName: "Bob", lastName: "B" },
    ];
    // Votes: 2 for p1 (Alice), 1 for p2 (Bob)
    const mockVotes = {
        rows: [
            { nominated_user_id: "p1", reason: "mvp" },
            { nominated_user_id: "p1", reason: "mvp" },
            { nominated_user_id: "p2", reason: "mvp" },
        ],
    };

    const renderComponent = (props = {}) => {
        return render(
            <WinnerDisplay
                activeAward="mvp"
                game={mockGame}
                players={mockPlayers}
                team={mockTeam}
                user={mockUser}
                votes={mockVotes}
                {...props}
            />,
        );
    };

    it("displays the winner correctly", () => {
        renderComponent();

        expect(screen.getByText("Alice A")).toBeInTheDocument();
        // The component renders "2 votes" inside a Badge, not "Votes: 2"
        expect(screen.getByText("2 votes")).toBeInTheDocument();
        expect(screen.getByText("Winner!")).toBeInTheDocument();
    });

    it("displays tie correctly", () => {
        const tieVotes = {
            rows: [
                { nominated_user_id: "p1", reason: "mvp" },
                { nominated_user_id: "p2", reason: "mvp" },
            ],
        };
        renderComponent({ votes: tieVotes });

        expect(screen.getByText("Alice A")).toBeInTheDocument();
        expect(screen.getByText("Bob B")).toBeInTheDocument();
        // In case of tie: "Tie!" and "Each with 1 vote"
        expect(screen.getByText("Tie!")).toBeInTheDocument();
        expect(screen.getByText(/Each with 1 vote/i)).toBeInTheDocument();
    });

    it("renders waiting message if no votes", () => {
        renderComponent({ votes: { rows: [] } });
        expect(
            screen.getByText("No votes recorded for this award yet."),
        ).toBeInTheDocument();
    });

    it("triggers confetti if current user is winner", async () => {
        const userIsWinner = { $id: "p1", firstName: "Alice" };

        renderComponent({ user: userIsWinner });

        await waitFor(() => {
            expect(screen.getByText("Alice A")).toBeInTheDocument();
        });

        // The component has a 500ms debounce before triggering confetti
        await waitFor(
            () => {
                expect(confetti.create).toHaveBeenCalled();
            },
            { timeout: 2000 },
        );
    });
});
