import { screen, fireEvent, cleanup } from "@testing-library/react";
import { render } from "@/utils/test-utils";

import { useNotifications } from "@/hooks/useNotifications";
import NotificationToggle from "../NotificationToggle";

// Mock the custom hook
jest.mock("@/hooks/useNotifications");

describe("NotificationToggle Component", () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it("renders 'Not Supported' alert when notifications are not supported", () => {
        useNotifications.mockReturnValue({ isSupported: false });
        render(<NotificationToggle />);

        expect(screen.getByText("Not Supported")).toBeInTheDocument();
        expect(
            screen.getByText(/notifications are not supported/i),
        ).toBeInTheDocument();
    });

    it("renders 'Notifications Blocked' alert when permission is denied", () => {
        useNotifications.mockReturnValue({
            isSupported: true,
            isDenied: true,
        });
        render(<NotificationToggle />);

        expect(screen.getByText("Notifications Blocked")).toBeInTheDocument();
        expect(
            screen.getByText(/you have blocked notifications/i),
        ).toBeInTheDocument();
    });

    it("renders 'Enable Notifications' button when unsubscribed", () => {
        const toggleSubscription = jest.fn();
        useNotifications.mockReturnValue({
            isSupported: true,
            isDenied: false,
            isSubscribed: false,
            isLoading: false,
            toggleSubscription,
        });

        render(<NotificationToggle />);

        const button = screen.getByRole("button", { name: /enable/i });
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(toggleSubscription).toHaveBeenCalled();
    });

    it("renders 'Disable Notifications' button when subscribed", () => {
        const toggleSubscription = jest.fn();
        useNotifications.mockReturnValue({
            isSupported: true,
            isDenied: false,
            isSubscribed: true,
            isLoading: false,
            toggleSubscription,
        });

        render(<NotificationToggle />);

        const button = screen.getByRole("button", { name: /disable/i });
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(toggleSubscription).toHaveBeenCalled();
    });
});
