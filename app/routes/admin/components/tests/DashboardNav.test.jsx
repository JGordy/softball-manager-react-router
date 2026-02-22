import { render, screen, fireEvent } from "@/utils/test-utils";
import { MobileDashboardNav } from "../DashboardNav";

// Mock IntersectionObserver
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
window.IntersectionObserver = jest.fn(() => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
}));

// Mock window.scrollTo
window.scrollTo = jest.fn();

describe("MobileDashboardNav", () => {
    it("renders all navigation items", () => {
        render(<MobileDashboardNav />);

        expect(
            screen.getByRole("button", { name: /Stats/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Health/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Teams/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Users/i }),
        ).toBeInTheDocument();
    });

    it("calls scrollTo when an item is clicked", () => {
        // Mock getElementById to return a dummy element
        const mockElement = {
            getBoundingClientRect: () => ({ top: 100 }),
        };
        document.getElementById = jest.fn().mockReturnValue(mockElement);

        render(<MobileDashboardNav />);
        const statsButton = screen.getByRole("button", { name: /Stats/i });
        fireEvent.click(statsButton);

        expect(window.scrollTo).toHaveBeenCalled();
        expect(document.getElementById).toHaveBeenCalledWith(
            "analytics-summary",
        );
    });
});
