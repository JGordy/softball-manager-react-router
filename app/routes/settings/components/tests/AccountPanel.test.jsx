import { useOutletContext } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import useModal from "@/hooks/useModal";

import AccountPanel from "../AccountPanel";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useOutletContext: jest.fn(),
}));

// Mock hooks
jest.mock("@/hooks/useModal");

describe("AccountPanel Component", () => {
    const mockUser = {
        $id: "user-123",
        email: "test@example.com",
        phone: "+15551234567",
        name: "Test User",
    };

    const mockModal = {
        openModal: jest.fn(),
        closeAllModals: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useOutletContext.mockReturnValue({ user: mockUser });
        useModal.mockReturnValue(mockModal);
    });

    it("renders user contact info", () => {
        render(<AccountPanel />);

        expect(screen.getByText("test@example.com")).toBeInTheDocument();
        expect(screen.getByText("(555) 123-4567")).toBeInTheDocument();
    });

    it("opens update modal on pencil click", () => {
        render(<AccountPanel />);

        fireEvent.click(screen.getByLabelText("Update Contact Information"));
        expect(mockModal.openModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Update Contact Information",
            }),
        );
    });

    it("renders success alert from actionData", () => {
        render(
            <AccountPanel
                actionData={{ success: true, message: "Updated!" }}
            />,
        );

        expect(screen.getByText("Updated!")).toBeInTheDocument();
    });
});
