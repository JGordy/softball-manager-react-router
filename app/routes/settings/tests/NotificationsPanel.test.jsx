import { render, screen, fireEvent, waitFor } from "@/utils/test-utils";

import { useNotifications } from "@/hooks/useNotifications";
import { showNotification } from "@/utils/showNotification";

import NotificationsPanel from "../components/NotificationsPanel";

// Mock hooks
jest.mock("@/hooks/useNotifications");
jest.mock("@/utils/showNotification");

// Mock Fetch
global.fetch = jest.fn();

describe("NotificationsPanel Component", () => {
    const mockTeams = [{ $id: "team-1", name: "Team One" }];
    const mockUseNotifications = {
        isSubscribed: true,
        checkTeamSubscription: jest.fn().mockResolvedValue(true),
        subscribeToTeam: jest.fn().mockResolvedValue(true),
        unsubscribeFromTeam: jest.fn().mockResolvedValue(true),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useNotifications.mockReturnValue(mockUseNotifications);
    });

    it("renders team rows when subscribed", async () => {
        render(<NotificationsPanel teams={mockTeams} />);

        expect(await screen.findByText("Team One")).toBeInTheDocument();
    });

    it("handles team subscription change", async () => {
        render(<NotificationsPanel teams={mockTeams} />);

        // Switch is an input type checkbox
        const toggle = await screen.findByLabelText(
            "Toggle notifications for Team One",
        );
        fireEvent.click(toggle);

        await waitFor(() => {
            expect(
                mockUseNotifications.unsubscribeFromTeam,
            ).toHaveBeenCalledWith("team-1");
        });
    });

    it("sends test notification", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        render(<NotificationsPanel teams={mockTeams} />);

        const testBtn = screen.getByText("Send Test Notification");
        fireEvent.click(testBtn);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                "/api/test-notification",
                expect.any(Object),
            );
        });
    });

    it("shows error if test notification fails", async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: "Failed" }),
        });

        render(<NotificationsPanel teams={mockTeams} />);

        fireEvent.click(screen.getByText("Send Test Notification"));

        await waitFor(() => {
            expect(showNotification).toHaveBeenCalledWith(
                expect.objectContaining({ variant: "error" }),
            );
        });
    });
});
