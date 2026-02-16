import { useOutletContext, useFetcher } from "react-router";

import { render, screen, fireEvent, waitFor, within } from "@/utils/test-utils";

import AvailablityContainer from "../AvailablityContainer";

// Mock react-router
jest.mock("react-router", () => ({
    useOutletContext: jest.fn(),
    useFetcher: jest.fn(),
}));

// Mock icons
jest.mock("@tabler/icons-react", () => ({
    IconChevronDown: () => <div data-testid="icon-chevron-down" />,
    IconCircleCheckFilled: () => <div data-testid="icon-check" />,
    IconHelpTriangleFilled: () => <div data-testid="icon-help" />,
    IconMessageCircleOff: () => <div data-testid="icon-message-off" />,
    IconSquareXFilled: () => <div data-testid="icon-x" />,
}));

// Mock analytics
jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

const mockSubmit = jest.fn();

describe("AvailablityContainer", () => {
    const mockUser = { $id: "user1", firstName: "Test", lastName: "User" };
    // Use a future date to ensure toggle buttons render
    const mockGame = {
        $id: "game1",
        gameDate: "2099-06-01T18:00:00Z",
        timeZone: "UTC",
    };
    const mockTeam = { $id: "team1" };
    const mockPlayers = [
        {
            $id: "user1",
            firstName: "Test",
            lastName: "User",
            preferredPositions: ["Pitcher"],
        },
        {
            $id: "user2",
            firstName: "Other",
            lastName: "Player",
            preferredPositions: ["Catcher"],
        },
    ];
    const mockAttendance = {
        rows: [
            { playerId: "user1", status: "accepted", $updatedAt: "2024-05-01" },
            { playerId: "user2", status: "unknown", $updatedAt: "2024-05-01" },
        ],
    };

    beforeEach(() => {
        useOutletContext.mockReturnValue({ user: mockUser });
        useFetcher.mockReturnValue({
            state: "idle",
            submit: mockSubmit,
            Form: ({ children }) => <form>{children}</form>,
        });
        jest.clearAllMocks();
    });

    const renderComponent = (props = {}) => {
        return render(
            <AvailablityContainer
                attendance={mockAttendance}
                game={mockGame}
                players={mockPlayers}
                team={mockTeam}
                managerView={false}
                {...props}
            />,
        );
    };

    it("renders list of players", () => {
        renderComponent();
        expect(screen.getByText("Test User")).toBeInTheDocument();
        expect(screen.getByText("Other Player")).toBeInTheDocument();
    });

    it("displays correct availability status icons", () => {
        renderComponent();

        // Icons appear in:
        // 1. Legend at top
        // 2. Group Headers (if players in group)
        // 3. Player Cards (if player in group)

        // user1 (accepted): 1 (legend) + 1 (header) + 1 (card) = 3
        expect(screen.getAllByTestId("icon-check")).toHaveLength(3);

        // user2 (unknown): 1 (legend) + 1 (header) + 1 (card) = 3
        expect(screen.getAllByTestId("icon-message-off")).toHaveLength(3);

        // unused statuses (declined, tentative): 1 (legend) only
        expect(screen.getAllByTestId("icon-x")).toHaveLength(1);
    });

    it("allows user to update their own availability", async () => {
        renderComponent();

        const userCardText = screen.getByText("Test User");

        const cardContainer = userCardText.closest(".mantine-Card-root");

        const toggleButton =
            within(cardContainer).getByTestId(
                "icon-chevron-down",
            ).parentElement;

        fireEvent.click(toggleButton);

        await waitFor(() => {
            expect(
                within(cardContainer).getByText(
                    "Will you be attending the game?",
                ),
            ).toBeInTheDocument();
        });

        // Click the "No" option (declined)
        const noOption = within(cardContainer).getByText("No");
        fireEvent.click(noOption);

        expect(mockSubmit).toHaveBeenCalledWith(
            expect.any(FormData),
            expect.objectContaining({
                method: "post",
                action: "/events/game1",
            }),
        );

        // Verify correct data was sent
        const formData = mockSubmit.mock.calls[0][0];
        expect(formData.get("playerId")).toBe("user1");
        expect(formData.get("status")).toBe("declined");
    });

    it("allows manager to update any player availability", async () => {
        renderComponent({ managerView: true });

        const toggleButtons = screen.getAllByTestId("icon-chevron-down");
        expect(toggleButtons).toHaveLength(2);

        // Click the second toggle
        fireEvent.click(toggleButtons[1].parentElement);

        const cardContainer = screen
            .getByText("Other Player")
            .closest("div[class*='mantine-Card-root']");

        await waitFor(() => {
            expect(
                within(cardContainer).getByText(
                    "Will you be attending the game?",
                ),
            ).toBeInTheDocument();
        });

        // Click "Yes" inside this card
        const yesButton = within(cardContainer).getByText("Yes");
        fireEvent.click(yesButton);

        expect(mockSubmit).toHaveBeenCalledWith(
            expect.any(FormData),
            expect.objectContaining({
                method: "post",
                action: "/events/game1",
            }),
        );

        const formData = mockSubmit.mock.calls[0][0];
        expect(formData.get("playerId")).toBe("user2");
        expect(formData.get("status")).toBe("accepted");
    });

    it("does not allow editing for past games", () => {
        const pastGame = {
            ...mockGame,
            gameDate: "2020-01-01T12:00:00Z",
        };
        renderComponent({ game: pastGame });

        expect(
            screen.queryByTestId("icon-chevron-down"),
        ).not.toBeInTheDocument();
    });
});
