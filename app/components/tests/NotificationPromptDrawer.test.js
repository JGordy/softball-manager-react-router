import { render, screen, fireEvent, act } from "@/utils/test-utils";
import { useNotifications } from "@/hooks/useNotifications";
import * as mantineHooks from "@mantine/hooks";

import NotificationPromptDrawer from "../NotificationPromptDrawer";

// Mocks
jest.mock("@/hooks/useNotifications");
jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

jest.mock("../DrawerContainer", () => {
    return function MockDrawer({ opened, onClose, children }) {
        if (!opened) return null;
        return (
            <div data-testid="drawer">
                <button onClick={onClose} data-testid="close-button">
                    Close
                </button>
                {children}
            </div>
        );
    };
});

describe("NotificationPromptDrawer", () => {
    let useOsSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        useOsSpy = jest.spyOn(mantineHooks, "useOs").mockReturnValue("ios");
        useNotifications.mockReturnValue({
            isSubscribed: false,
            isSupported: true,
            subscribe: jest.fn(),
        });
    });

    afterEach(() => {
        useOsSpy.mockRestore();
    });

    it("renders nothing if already subscribed", () => {
        useNotifications.mockReturnValue({
            isSubscribed: true,
            isSupported: true,
        });
        render(<NotificationPromptDrawer />);
        jest.useFakeTimers();
        act(() => {
            jest.runAllTimers();
        });
        expect(screen.queryByTestId("drawer")).toBeNull();
        jest.useRealTimers();
    });

    it("renders nothing if not supported", () => {
        useNotifications.mockReturnValue({
            isSubscribed: false,
            isSupported: false,
        });
        render(<NotificationPromptDrawer />);
        jest.useFakeTimers();
        act(() => {
            jest.runAllTimers();
        });
        expect(screen.queryByTestId("drawer")).toBeNull();
        jest.useRealTimers();
    });

    it("renders nothing if dismissed previously", () => {
        localStorage.setItem("notification_drawer_dismissed", "true");
        render(<NotificationPromptDrawer />);
        jest.useFakeTimers();
        act(() => {
            jest.runAllTimers();
        });
        expect(screen.queryByTestId("drawer")).toBeNull();
        jest.useRealTimers();
    });

    it("opens after delay", () => {
        jest.useFakeTimers();
        render(<NotificationPromptDrawer />);

        expect(screen.queryByTestId("drawer")).toBeNull();

        act(() => {
            jest.advanceTimersByTime(10000); // 10s delay
        });

        expect(screen.getByTestId("drawer")).toBeInTheDocument();
        jest.useRealTimers();
    });

    it("calls subscribe on button click", async () => {
        const subscribeMock = jest.fn();
        useNotifications.mockReturnValue({
            isSubscribed: false,
            isSupported: true,
            subscribe: subscribeMock,
        });

        jest.useFakeTimers();
        render(<NotificationPromptDrawer />);
        act(() => {
            jest.advanceTimersByTime(10000);
        });

        const btn = screen.getByText(/enable notifications/i);
        fireEvent.click(btn);

        expect(subscribeMock).toHaveBeenCalled();
        jest.useRealTimers();
    });

    it("dismisses and saves preference", () => {
        jest.useFakeTimers();
        render(<NotificationPromptDrawer />);
        act(() => {
            jest.advanceTimersByTime(10000);
        });

        fireEvent.click(screen.getByTestId("close-button"));

        expect(screen.queryByTestId("drawer")).toBeNull();
        expect(localStorage.getItem("notification_drawer_dismissed")).toBe(
            "true",
        );
        jest.useRealTimers();
    });
});
