import { showNotification, useResponseNotification } from "../showNotification";
import { notifications } from "@mantine/notifications";
import { renderHook } from "@testing-library/react";
import useModal from "@/hooks/useModal";

// Mock dependencies
jest.mock("@mantine/notifications", () => ({
    notifications: {
        show: jest.fn(),
    },
}));

jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: jest.fn(),
}));

describe("showNotification utility", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("showNotification", () => {
        it("should show notification with default options", () => {
            showNotification({ message: "Test message" });

            expect(notifications.show).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Test message",
                    title: "Info",
                    color: "blue",
                    autoClose: 5000,
                    position: "top-center",
                    withCloseButton: true,
                }),
            );
        });

        it("should show success notification", () => {
            showNotification({ message: "Success!", variant: "success" });

            expect(notifications.show).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Success!",
                    title: "Success",
                    color: "green",
                }),
            );
        });

        it("should show error notification", () => {
            showNotification({ message: "Error!", variant: "error" });

            expect(notifications.show).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Error!",
                    title: "Error",
                    color: "red.9",
                }),
            );
        });

        it("should override defaults with provided options", () => {
            showNotification({
                message: "Custom",
                title: "Custom Title",
                autoClose: 1000,
                position: "bottom-right",
            });

            expect(notifications.show).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Custom",
                    title: "Custom Title",
                    autoClose: 1000,
                    position: "bottom-right",
                }),
            );
        });
    });

    describe("useResponseNotification", () => {
        const mockCloseAllModals = jest.fn();

        beforeEach(() => {
            useModal.mockReturnValue({ closeAllModals: mockCloseAllModals });
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it("should do nothing if actionData is null", () => {
            renderHook(() => useResponseNotification(null));
            expect(mockCloseAllModals).toHaveBeenCalled();
            expect(notifications.show).not.toHaveBeenCalled();
        });

        it("should show success notification on success", () => {
            const actionData = { success: true, message: "Action successful" };
            renderHook(() => useResponseNotification(actionData));

            expect(mockCloseAllModals).toHaveBeenCalled();

            // Fast-forward time
            jest.advanceTimersByTime(1500);

            expect(notifications.show).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Action successful",
                    title: "Success",
                    color: "green",
                }),
            );
        });

        it("should show error notification on failure", () => {
            const actionData = { success: false, message: "Action failed" };
            const consoleErrorSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            renderHook(() => useResponseNotification(actionData));

            expect(mockCloseAllModals).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled();

            // Fast-forward time
            jest.advanceTimersByTime(1500);

            expect(notifications.show).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Action failed",
                    title: "Error",
                    color: "red.9",
                }),
            );

            consoleErrorSpy.mockRestore();
        });
    });
});
