import { render, screen, fireEvent } from "@/utils/test-utils";
import TeamSearchModal from "../TeamSearchModal";

describe("TeamSearchModal Component", () => {
    const mockTeamList = [
        {
            $id: "team-1",
            name: "Ormewood Park Sliders",
            primaryColor: "#e63946",
            isManager: true,
        },
        {
            $id: "team-2",
            name: "Atlanta Braves",
            primaryColor: "#005a9c",
            isManager: false,
        },
    ];

    const mockOnClose = jest.fn();
    const mockOnSelectTeam = jest.fn();

    const renderModal = (props = {}) => {
        return render(
            <TeamSearchModal
                onClose={mockOnClose}
                teamList={mockTeamList}
                onSelectTeam={mockOnSelectTeam}
                {...props}
            />,
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders search input and team list", () => {
        renderModal();

        expect(
            screen.getByPlaceholderText("Search teams..."),
        ).toBeInTheDocument();
        expect(screen.getByText("Ormewood Park Sliders")).toBeInTheDocument();
        expect(screen.getByText("Atlanta Braves")).toBeInTheDocument();
    });

    it("displays Manager badge only for teams where user is manager", () => {
        renderModal();

        expect(screen.getByText("Manager")).toBeInTheDocument();
        const managerBadges = screen.getAllByText("Manager");
        expect(managerBadges.length).toBe(1);
    });

    it("filters team list dynamically as query is typed", () => {
        renderModal();

        const input = screen.getByPlaceholderText("Search teams...");
        fireEvent.change(input, { target: { value: "Braves" } });

        expect(screen.getByText("Atlanta Braves")).toBeInTheDocument();
        expect(
            screen.queryByText("Ormewood Park Sliders"),
        ).not.toBeInTheDocument();
    });

    it("displays empty state when no teams match the search query", () => {
        renderModal();

        const input = screen.getByPlaceholderText("Search teams...");
        fireEvent.change(input, { target: { value: "NonExistentTeam" } });

        expect(
            screen.getByText('No teams matching "NonExistentTeam"'),
        ).toBeInTheDocument();
    });

    it("calls onSelectTeam and onClose when a team is clicked", () => {
        renderModal();

        const teamButton = screen.getByText("Ormewood Park Sliders");
        fireEvent.click(teamButton);

        expect(mockOnSelectTeam).toHaveBeenCalledWith("team-1");
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("handles empty team list gracefully", () => {
        renderModal({ teamList: [] });

        expect(screen.getByText('No teams matching ""')).toBeInTheDocument();
    });
});
