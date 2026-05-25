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
        // 1. Group Headers (if players in group)
        // 2. Player Cards (if player in group and they don't have toggle permissions)

        // user1 (accepted, toggle enabled): 1 (header) + 0 (card) = 1
        expect(screen.getAllByTestId("icon-check")).toHaveLength(1);

        // user2 (unknown, toggle disabled): 1 (header) + 1 (card) = 2
        expect(screen.getAllByTestId("icon-message-off")).toHaveLength(2);

        // unused statuses (declined, tentative): 0
        expect(screen.queryByTestId("icon-x")).not.toBeInTheDocument();
    });

    it("allows user to update their own availability", async () => {
        renderComponent();

        const userCardText = screen.getByText("Test User");
        const cardContainer = userCardText.closest(".mantine-Card-root");

        // Click the "No" option (declined) directly from the SegmentedControl
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

        const cardContainer = screen
            .getByText("Other Player")
            .closest("div[class*='mantine-Card-root']");

        // Click "Yes" inside this card directly from the SegmentedControl
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

        const userCardText = screen.getByText("Test User");
        const cardContainer = userCardText.closest(".mantine-Card-root");

        expect(
            within(cardContainer).queryByText("Yes"),
        ).not.toBeInTheDocument();
    });
});
