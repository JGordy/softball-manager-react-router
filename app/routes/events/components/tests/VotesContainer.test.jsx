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

// Mock showNotification
jest.mock("@/utils/showNotification", () => ({
    showNotification: jest.fn(),
}));
import { showNotification } from "@/utils/showNotification";

describe("VotesContainer", () => {
    const mockUser = { $id: "user1" };
    const mockGame = { $id: "game1" };
    const mockTeam = { $id: "team1" };
    const mockPlayers = [
        {
            $id: "p1",
            firstName: "Alice",
            lastName: "A",
            preferredPositions: ["Pitcher"],
        },
        {
            $id: "p2",
            firstName: "Bob",
            lastName: "B",
            preferredPositions: ["Shortstop"],
        },
    ];
    const mockAttendance = { rows: [] };
    const mockVotes = { rows: [] };
    const mockSubmit = jest.fn();

    beforeEach(() => {
        useFetcher.mockReturnValue({
            state: "idle",
            data: null,
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

    it("renders vote selection dropdown when user has no existing votes", () => {
        renderComponent();
        expect(screen.getByText("Vote for a Player:")).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText("Select a player"),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Submit All Votes" }),
        ).toBeInTheDocument();
    });

    it("renders submitted view with nominated player when user has existing votes", () => {
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

        expect(screen.getByText("Your Vote:")).toBeInTheDocument();
        expect(screen.getByText("Vote Submitted")).toBeInTheDocument();
        expect(screen.getByText("Bob B")).toBeInTheDocument();
        expect(screen.getByText("Shortstop")).toBeInTheDocument();
        expect(screen.getByText("Your Pick")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Change Votes" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByPlaceholderText("Select a player"),
        ).not.toBeInTheDocument();
    });

    it("displays empty state when user has submitted other votes but not for the active award", () => {
        const existingVotes = {
            rows: [
                {
                    $id: "vote1",
                    voter_user_id: "user1",
                    nominated_user_id: "p2",
                    reason: "clutch",
                },
            ],
        };
        renderComponent({ votes: existingVotes, activeAward: "mvp" });

        expect(screen.getByText("Your Vote:")).toBeInTheDocument();
        expect(
            screen.getByText("No vote cast for this award."),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Change Votes" }),
        ).toBeInTheDocument();
    });

    it("allows user to click Change Votes, edit nomination, and cancel to revert", () => {
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

        // Initially in submitted mode
        expect(screen.getByText("Bob B")).toBeInTheDocument();

        // Click Change Votes
        fireEvent.click(screen.getByRole("button", { name: "Change Votes" }));

        // Now in edit mode
        expect(screen.getByDisplayValue("Bob B")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Update Votes" }),
        ).toBeInTheDocument();
        const cancelButton = screen.getByRole("button", { name: "Cancel" });
        expect(cancelButton).toBeInTheDocument();

        // Click Cancel to exit edit mode
        fireEvent.click(cancelButton);

        // Returns to submitted mode
        expect(screen.getByText("Bob B")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Change Votes" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByPlaceholderText("Select a player"),
        ).not.toBeInTheDocument();
    });

    it("submits vote when button clicked and submits correct payload", () => {
        renderComponent();

        // Simulate selecting a player
        const input = screen.getByPlaceholderText("Select a player");
        fireEvent.click(input);

        // Select "Alice A"
        fireEvent.click(screen.getByText("Alice A"));

        // Click submit
        const submitButton = screen.getByRole("button", {
            name: "Submit All Votes",
        });
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

    it("shows success notification and switches to submitted mode on successful submission", () => {
        const { rerender } = renderComponent();

        // Transition fetcher state to submitting
        useFetcher.mockReturnValue({
            state: "submitting",
            data: null,
            submit: mockSubmit,
        });
        rerender(
            <VotesContainer
                activeAward="mvp"
                attendance={mockAttendance}
                game={mockGame}
                team={mockTeam}
                user={mockUser}
                players={mockPlayers}
                votes={mockVotes}
            />,
        );

        // Transition fetcher state to idle with success response
        useFetcher.mockReturnValue({
            state: "idle",
            data: { success: true },
            submit: mockSubmit,
        });
        rerender(
            <VotesContainer
                activeAward="mvp"
                attendance={mockAttendance}
                game={mockGame}
                team={mockTeam}
                user={mockUser}
                players={mockPlayers}
                votes={{
                    rows: [
                        {
                            $id: "vote1",
                            voter_user_id: "user1",
                            nominated_user_id: "p1",
                            reason: "mvp",
                        },
                    ],
                }}
            />,
        );

        expect(showNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                variant: "success",
                title: "Votes Submitted",
            }),
        );
        expect(screen.getByText("Alice A")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Change Votes" }),
        ).toBeInTheDocument();
    });

    it("shows error notification if submission fails", () => {
        const { rerender } = renderComponent();

        useFetcher.mockReturnValue({
            state: "submitting",
            data: null,
            submit: mockSubmit,
        });
        rerender(
            <VotesContainer
                activeAward="mvp"
                attendance={mockAttendance}
                game={mockGame}
                team={mockTeam}
                user={mockUser}
                players={mockPlayers}
                votes={mockVotes}
            />,
        );

        useFetcher.mockReturnValue({
            state: "idle",
            data: { success: false, error: "Network error" },
            submit: mockSubmit,
        });
        rerender(
            <VotesContainer
                activeAward="mvp"
                attendance={mockAttendance}
                game={mockGame}
                team={mockTeam}
                user={mockUser}
                players={mockPlayers}
                votes={mockVotes}
            />,
        );

        expect(showNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                variant: "error",
                title: "Submission Failed",
                message: "Network error",
            }),
        );
    });
});
