import { render, screen, fireEvent } from "@/utils/test-utils";

import useModal from "@/hooks/useModal";

import ProfileMenu from "../ProfileMenu";

jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock("@/forms/AddPlayer", () => () => <div data-testid="add-player" />);

describe("ProfileMenu Component", () => {
    const mockOpenModal = jest.fn();
    const mockCloseAllModals = jest.fn();
    const mockPlayer = {
        userId: "user-1",
        name: "Test Player",
    };

    beforeEach(() => {
        useModal.mockReturnValue({
            openModal: mockOpenModal,
            closeAllModals: mockCloseAllModals,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders the menu trigger", () => {
        render(<ProfileMenu player={mockPlayer} />);

        // The default trigger is an ActionIcon which is a button
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("calls openModal with correct title for personal details", async () => {
        render(<ProfileMenu player={mockPlayer} />);

        // Open menu first
        fireEvent.click(screen.getByRole("button"));

        // Use findByText to account for potential transitions/portals
        const personalButton = await screen.findByText(
            "Update Personal Details",
        );
        fireEvent.click(personalButton);

        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Update Personal Details",
            }),
        );
    });

    it("calls openModal with correct title for player details", async () => {
        render(<ProfileMenu player={mockPlayer} />);

        // Open menu first
        fireEvent.click(screen.getByRole("button"));

        const playerButton = await screen.findByText("Update Player Details");
        fireEvent.click(playerButton);

        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Update Player Details",
            }),
        );
    });
});
