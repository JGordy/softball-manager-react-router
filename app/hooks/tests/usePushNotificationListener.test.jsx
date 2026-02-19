import { renderHook, act } from "@testing-library/react";
import { onMessage } from "firebase/messaging";
import { useNavigate } from "react-router";

import { getMessagingIfSupported } from "@/utils/firebase";
import { showNotification } from "@/utils/showNotification";

import { usePushNotificationListener } from "../usePushNotificationListener";

// Mock the dependencies
jest.mock("firebase/messaging", () => ({
    onMessage: jest.fn(),
}));

jest.mock("react-router", () => ({
    useNavigate: jest.fn(),
}));

jest.mock("@mantine/notifications", () => ({
    notifications: {
        hide: jest.fn(),
    },
}));

jest.mock("@/utils/firebase", () => ({
    getMessagingIfSupported: jest.fn(),
}));

jest.mock("@/utils/showNotification", () => ({
    showNotification: jest.fn(),
}));

describe("usePushNotificationListener", () => {
    let mockNavigate;
    let mockUnsubscribe;

    beforeEach(() => {
        mockNavigate = jest.fn();
        useNavigate.mockReturnValue(mockNavigate);
        mockUnsubscribe = jest.fn();
        onMessage.mockReturnValue(mockUnsubscribe);
        getMessagingIfSupported.mockResolvedValue({ dummy: "messaging" });

        // Mock window.open
        jest.spyOn(window, "open").mockImplementation(() => ({}));
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it("should initialize FCM listener and return unsubscribe on unmount", async () => {
        const { unmount } = renderHook(() => usePushNotificationListener());

        // Wait for promise to resolve in useEffect
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        expect(getMessagingIfSupported).toHaveBeenCalled();
        expect(onMessage).toHaveBeenCalledWith(
            { dummy: "messaging" },
            expect.any(Function),
        );

        unmount();
        expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("should not initialize if messaging is not supported", async () => {
        getMessagingIfSupported.mockResolvedValue(null);
        renderHook(() => usePushNotificationListener());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        expect(getMessagingIfSupported).toHaveBeenCalled();
        expect(onMessage).not.toHaveBeenCalled();
    });

    it("should handle nested url and navigate on click", async () => {
        renderHook(() => usePushNotificationListener());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        const callback = onMessage.mock.calls[0][1];
        // Simulating the Appwrite/FCM pattern where custom data is in data.data.url
        callback({
            notification: { title: "Title", body: "Body" },
            data: {
                data: { url: "/nested" },
            },
        });

        expect(showNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Title",
                message: "Body",
            }),
        );

        // Trigger the onClick
        const notificationOptions = showNotification.mock.calls[0][0];
        expect(typeof notificationOptions.onClick).toBe("function");
        notificationOptions.onClick();

        expect(mockNavigate).toHaveBeenCalledWith("/nested");
    });

    it("should handle external URLs and open in new window", async () => {
        renderHook(() => usePushNotificationListener());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        const callback = onMessage.mock.calls[0][1];
        callback({
            data: { url: "https://example.com/external" },
        });

        const notificationOptions = showNotification.mock.calls[0][0];
        notificationOptions.onClick();

        expect(window.open).toHaveBeenCalledWith(
            "https://example.com/external",
            "_blank",
            "noopener,noreferrer",
        );
    });

    it("should handle stringified data correctly", async () => {
        renderHook(() => usePushNotificationListener());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        const callback = onMessage.mock.calls[0][1];
        callback({
            data: JSON.stringify({ url: "/spa-route", title: "Custom" }),
        });

        expect(showNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Custom",
            }),
        );

        const notificationOptions = showNotification.mock.calls[0][0];
        notificationOptions.onClick();
        expect(mockNavigate).toHaveBeenCalledWith("/spa-route");
    });

    it("should handle malformed stringified data by defaulting to empty object", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        renderHook(() => usePushNotificationListener());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        const callback = onMessage.mock.calls[0][1];
        callback({
            data: "{ invalid json }",
        });

        expect(showNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Notification", // Default title
            }),
        );
        consoleSpy.mockRestore();
    });

    it("should not provide onClick if no URL is present in payload", async () => {
        renderHook(() => usePushNotificationListener());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        const callback = onMessage.mock.calls[0][1];
        callback({
            notification: { title: "No URL", body: "No URL Body" },
            data: {},
        });

        const notificationOptions = showNotification.mock.calls[0][0];
        expect(notificationOptions.onClick).toBeUndefined();
    });

    it("should log error if initialization fails", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        getMessagingIfSupported.mockRejectedValue(new Error("Init failed"));

        renderHook(() => usePushNotificationListener());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        expect(consoleSpy).toHaveBeenCalledWith(
            "[Push Notification] Failed to initialize Firebase messaging:",
            expect.any(Error),
        );
        consoleSpy.mockRestore();
    });
});
