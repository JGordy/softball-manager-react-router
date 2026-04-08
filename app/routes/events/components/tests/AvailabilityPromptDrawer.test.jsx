import * as reactRouter from "react-router";
import { render, screen, fireEvent, waitFor } from "@/utils/test-utils";

import AvailabilityPromptDrawer from "../AvailabilityPromptDrawer";

// Mock react-router hook
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useFetcher: jest.fn(),
}));

describe("AvailabilityPromptDrawer Component", () => {
    const mockOnClose = jest.fn();
    const mockSubmit = jest.fn();

    const defaultProps = {
        opened: true,
        onClose: mockOnClose,
        game: { $id: "game123" },
        player: { $id: "player456" },
        teamId: "team789",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        reactRouter.useFetcher.mockReturnValue({
            submit: mockSubmit,
            state: "idle",
            data: null,
        });
    });

    it("renders with the correct header and message", () => {
        render(<AvailabilityPromptDrawer {...defaultProps} />);

        expect(screen.getByText("Submit Availability")).toBeInTheDocument();
        expect(
            screen.getByText(/Please let your coach know/),
        ).toBeInTheDocument();
    });

    it("renders all availability options", () => {
        render(<AvailabilityPromptDrawer {...defaultProps} />);

        expect(screen.getByText("Attending")).toBeInTheDocument();
        expect(screen.getByText("Not Attending")).toBeInTheDocument();
        expect(screen.getByText("Maybe")).toBeInTheDocument();
    });

    it("calls submit with correct data when option selected and SUBMIT clicked", () => {
        render(<AvailabilityPromptDrawer {...defaultProps} />);

        // Select Attending
        fireEvent.click(screen.getByTestId("availability-option-accepted"));
        fireEvent.click(screen.getByRole("button", { name: /SUBMIT/i }));

        expect(mockSubmit).toHaveBeenCalledWith(
            expect.any(FormData),
            expect.objectContaining({
                method: "post",
                action: "/events/game123",
            }),
        );

        const formData = mockSubmit.mock.calls[0][0];
        expect(formData.get("_action")).toBe("update-attendance");
        expect(formData.get("playerId")).toBe("player456");
        expect(formData.get("status")).toBe("accepted");
        expect(formData.get("teamId")).toBe("team789");
    });

    it("calls onClose when submission is successful", async () => {
        const { rerender } = render(
            <AvailabilityPromptDrawer {...defaultProps} />,
        );

        // Mock success state
        reactRouter.useFetcher.mockReturnValue({
            submit: mockSubmit,
            state: "idle",
            data: { success: true },
        });

        rerender(<AvailabilityPromptDrawer {...defaultProps} />);

        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it("calls onClose when Decide Later is clicked", () => {
        render(<AvailabilityPromptDrawer {...defaultProps} />);

        fireEvent.click(screen.getByRole("button", { name: /Decide Later/i }));
        expect(mockOnClose).toHaveBeenCalled();
    });
});
