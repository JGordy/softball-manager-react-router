import {
    render,
    screen,
    fireEvent,
    cleanup,
    waitFor,
} from "@/utils/test-utils";
import { showNotification } from "@/utils/showNotification";

import ShareUrlButton from "./ShareUrlButton";

jest.mock("@/utils/showNotification", () => ({
    showNotification: jest.fn(),
}));

describe("ShareUrlButton Component", () => {
    let originalShare;
    let originalClipboard;

    beforeAll(() => {
        originalShare = navigator.share;
        originalClipboard = navigator.clipboard;
    });

    afterAll(() => {
        Object.defineProperty(navigator, "share", {
            value: originalShare,
            configurable: true,
        });
        Object.defineProperty(navigator, "clipboard", {
            value: originalClipboard,
            configurable: true,
        });
    });

    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it("renders correctly with share icon", () => {
        render(<ShareUrlButton />);
        expect(
            screen.getByRole("button", { name: /share page/i }),
        ).toBeInTheDocument();
    });

    it("calls navigator.share when supported", async () => {
        const mockShare = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, "share", {
            value: mockShare,
            configurable: true,
        });

        render(<ShareUrlButton />);
        const button = screen.getByRole("button", { name: /share page/i });
        fireEvent.click(button);

        await waitFor(() => expect(mockShare).toHaveBeenCalled());
    });

    it("falls back to clipboard and shows notification when navigator.share is unsupported", async () => {
        Object.defineProperty(navigator, "share", {
            value: undefined,
            configurable: true,
        });

        const mockWriteText = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, "clipboard", {
            value: { writeText: mockWriteText },
            configurable: true,
        });

        render(<ShareUrlButton />);
        const button = screen.getByRole("button", { name: /share page/i });
        fireEvent.click(button);

        await waitFor(() => expect(mockWriteText).toHaveBeenCalled());
        await waitFor(() =>
            expect(showNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Link copied to clipboard",
                    variant: "success",
                }),
            ),
        );
    });

    it("handles clipboard failure", async () => {
        Object.defineProperty(navigator, "share", {
            value: undefined,
            configurable: true,
        });

        const mockWriteText = jest
            .fn()
            .mockRejectedValue(new Error("Clipboard error"));
        Object.defineProperty(navigator, "clipboard", {
            value: { writeText: mockWriteText },
            configurable: true,
        });

        render(<ShareUrlButton />);
        const button = screen.getByRole("button", { name: /share page/i });
        fireEvent.click(button);

        await waitFor(() => expect(mockWriteText).toHaveBeenCalled());
        await waitFor(() =>
            expect(showNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Failed to copy link",
                    variant: "error",
                }),
            ),
        );
    });
});
