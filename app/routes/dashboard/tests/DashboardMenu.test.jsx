import { render, screen, fireEvent } from "@/utils/test-utils";

import useModal from "@/hooks/useModal";

import DashboardMenu from "../components/DashboardMenu";

// Mock icons
jest.mock("@tabler/icons-react", () => ({
    IconPlus: () => <div data-testid="icon-plus" />,
    IconDots: () => <div data-testid="icon-dots" />,
}));

// Mock hooks
jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: jest.fn(),
}));

describe("DashboardMenu", () => {
    const mockOpenModal = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useModal.mockReturnValue({
            openModal: mockOpenModal,
            closeAllModals: jest.fn(),
        });
    });

    const openMenu = async () => {
        const trigger = screen.getByTestId("icon-dots");
        fireEvent.click(trigger);
        return screen.findByText("Add New Team");
    };

    it("renders the add team option when menu is opened", async () => {
        render(<DashboardMenu userId="user-123" />);

        await openMenu();

        expect(screen.getByText("Add New Team")).toBeInTheDocument();
    });

    it("opens add team modal when menu item is clicked", async () => {
        render(<DashboardMenu userId="user-123" />);

        await openMenu();
        fireEvent.click(screen.getByText("Add New Team"));

        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Add a New Team",
            }),
        );
    });
});
