import { render, screen, fireEvent } from "@/utils/test-utils";
import PoliciesPanel from "../components/PoliciesPanel";
import { useOutletContext } from "react-router";
import useModal from "@/hooks/useModal";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useOutletContext: jest.fn(),
}));

jest.mock("@/hooks/useModal", () => jest.fn());

describe("PoliciesPanel Component", () => {
    let mockOpenModal;

    beforeEach(() => {
        jest.clearAllMocks();
        useOutletContext.mockReturnValue({ user: { name: "Test User" } });
        mockOpenModal = jest.fn();
        useModal.mockReturnValue({ openModal: mockOpenModal });
    });

    it("renders policy buttons", () => {
        render(<PoliciesPanel />);
        expect(
            screen.getByRole("button", { name: "View Beta User Agreement" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "View Privacy Policy" }),
        ).toBeInTheDocument();
    });

    it("opens beta modal via useModal on click", () => {
        render(<PoliciesPanel />);
        const btn = screen.getByRole("button", {
            name: "View Beta User Agreement",
        });
        fireEvent.click(btn);

        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Beta User Agreement",
            }),
        );
    });

    it("opens privacy modal via useModal on click", () => {
        render(<PoliciesPanel />);
        const btn = screen.getByRole("button", { name: "View Privacy Policy" });
        fireEvent.click(btn);

        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Privacy Policy for Rostrhq.app",
            }),
        );
    });
});
