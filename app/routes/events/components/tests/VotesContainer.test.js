import { useFetcher } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import VotesContainer from "../VotesContainer";

// Mock react-router
jest.mock("react-router", () => ({
    useFetcher: jest.fn(),
}));

// Mock addPlayerAvailability
jest.mock(
    "@/utils/addPlayerAvailability",
    () => jest.fn((rows, players) => players), // Simple passthrough for default
);
import addPlayerAvailability from "@/utils/addPlayerAvailability";

// Mock analytics
jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

describe("VotesContainer", () => {
    const mockUser = { $id: "user1" };
    const mockGame = { $id: "game1" };
    const mockTeam = { $id: "team1" };
    const mockPlayers = [
        { $id: "p1", firstName: "Alice", lastName: "A" },
        { $id: "p2", firstName: "Bob", lastName: "B" },
    ];
    const mockAttendance = { rows: [] };
    const mockVotes = { rows: [] };
    const mockSubmit = jest.fn();

    beforeEach(() => {
        useFetcher.mockReturnValue({
            state: "idle",
            submit: mockSubmit,
        });
        addPlayerAvailability.mockReturnValue(mockPlayers);
        jest.clearAllMocks();
    });

    const renderComponent = (props = {}) => {
        return render(
            <VotesContainer
                activeAward="mvp"
                attendance={mockAttendance}
                game={mockGame}
                team={mockTeam}
                user={mockUser}
                players={mockPlayers}
                votes={mockVotes}
                {...props}
            />,
        );
    };

    it("renders vote selection dropdown", () => {
        renderComponent();
        expect(screen.getByText("Vote for a Player:")).toBeInTheDocument();

        expect(
            screen.getByPlaceholderText("Select a player"),
        ).toBeInTheDocument();
    });

    it("pre-selects existing vote if present", () => {
        const existingVotes = {
            rows: [
                {
                    $id: "vote1",
                    voter_user_id: "user1",
                    nominated_user_id: "p2",
                    reason: "mvp",
                },
            ],
        };
        renderComponent({ votes: existingVotes });

        expect(screen.getByDisplayValue("Bob B")).toBeInTheDocument();
    });

    it("submits vote when button clicked", () => {
        renderComponent();

        // Simulate selecting a player
        // Opening the dropdown
        const input = screen.getByPlaceholderText("Select a player");
        fireEvent.click(input);

        // Select "Alice A"
        fireEvent.click(screen.getByText("Alice A"));

        // Click submit
        const submitButton = screen.getByText("Submit All Votes");
        fireEvent.click(submitButton);

        expect(mockSubmit).toHaveBeenCalledWith(
            expect.any(FormData),
            expect.objectContaining({
                method: "post",
                action: "/events/game1",
            }),
        );

        // Verify payload
        const formData = mockSubmit.mock.calls[0][0];
        const playerVotes = JSON.parse(formData.get("playerVotes"));
        expect(playerVotes.mvp.nominated_user_id).toBe("p1");
    });
});
