import { render, screen, fireEvent } from "@/utils/test-utils";

import useModal from "@/hooks/useModal";

import SeasonMenu from "../components/SeasonMenu";

// Mock icons
jest.mock("@tabler/icons-react", () => ({
    IconBallBaseball: () => <div data-testid="icon-baseball" />,
    IconCalendar: () => <div data-testid="icon-calendar" />,
    IconEdit: () => <div data-testid="icon-edit" />,
    IconDots: () => <div data-testid="icon-dots" />,
}));

// Mock hooks
jest.mock("@/hooks/useModal", () => ({
    __esModule: true,
    default: jest.fn(() => ({
        openModal: jest.fn(),
        closeAllModals: jest.fn(),
    })),
}));

describe("SeasonMenu", () => {
    const mockSeason = {
        $id: "season-123",
        teamId: "team-123",
        teams: [{ primaryColor: "#ff0000" }],
        location: "Central Park",
    };

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
        return screen.findByText("Edit Season");
    };

    it("renders the menu options when trigger is clicked", async () => {
        render(<SeasonMenu season={mockSeason} />);

        await openMenu();

        expect(screen.getByText("Generate Games")).toBeInTheDocument();
        expect(screen.getByText("Add Single Game")).toBeInTheDocument();
        expect(screen.getByText("Edit Season")).toBeInTheDocument();
        expect(screen.getByText("Season Details")).toBeInTheDocument();
        expect(screen.getByText("Schedule")).toBeInTheDocument();
    });

    it("opens edit season modal when option clicked", async () => {
        render(<SeasonMenu season={mockSeason} />);

        await openMenu();
        fireEvent.click(screen.getByText("Edit Season"));

        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Update Season Details",
            }),
        );
    });

    it("opens generate games modal when option clicked", async () => {
        render(<SeasonMenu season={mockSeason} />);

        await openMenu();
        fireEvent.click(screen.getByText("Generate Games"));

        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Generate Game Placeholders",
            }),
        );
    });

    it("opens add single game modal when option clicked", async () => {
        render(<SeasonMenu season={mockSeason} />);

        await openMenu();
        fireEvent.click(screen.getByText("Add Single Game"));

        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Add a Single Game",
            }),
        );
    });
});
