import { render, screen, fireEvent } from "@/utils/test-utils";
import ManageSeasonRosterDrawer from "../ManageSeasonRosterDrawer";

const mockUseNavigation = jest.fn(() => ({ state: "idle", formData: null }));

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigation: () => mockUseNavigation(),
}));

jest.mock("@/components/DrawerContainer", () => ({
    __esModule: true,
    default: ({ opened, children }) => (
        <div data-testid="drawer-container" data-opened={opened}>
            {children}
        </div>
    ),
}));

jest.mock("@/forms/FormWrapper", () => ({
    __esModule: true,
    default: ({ children, confirmText, loading }) => (
        <div
            data-testid="form-wrapper"
            data-loading={loading}
            data-confirmtext={confirmText}
        >
            {children}
        </div>
    ),
}));

describe("ManageSeasonRosterDrawer", () => {
    const mockTeamPlayers = [
        { $id: "player-1", name: "Player One", email: "one@test.com" },
        { $id: "player-2", name: "Player Two", email: "two@test.com" },
    ];
    const mockCurrentPlayers = [
        { $id: "player-1", name: "Player One", email: "one@test.com" },
    ];
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseNavigation.mockReturnValue({ state: "idle", formData: null });
    });

    it("renders players correctly and checks current players", () => {
        render(
            <ManageSeasonRosterDrawer
                opened={true}
                onClose={mockOnClose}
                teamPlayers={mockTeamPlayers}
                currentPlayers={mockCurrentPlayers}
                teamId="team-123"
                seasonId="season-456"
            />,
        );

        expect(screen.getByText("Player One")).toBeInTheDocument();
        expect(screen.getByText("Player Two")).toBeInTheDocument();

        // The Save button should display "(1)" initially
        const formWrapper = screen.getByTestId("form-wrapper");
        expect(formWrapper).toHaveAttribute(
            "data-confirmtext",
            "Save Season Roster (1)",
        );
    });

    it("toggles player selection when clicked", () => {
        render(
            <ManageSeasonRosterDrawer
                opened={true}
                onClose={mockOnClose}
                teamPlayers={mockTeamPlayers}
                currentPlayers={mockCurrentPlayers}
                teamId="team-123"
                seasonId="season-456"
            />,
        );

        // Click Player Two to select them
        fireEvent.click(screen.getByText("Player Two"));

        const formWrapper = screen.getByTestId("form-wrapper");
        expect(formWrapper).toHaveAttribute(
            "data-confirmtext",
            "Save Season Roster (2)",
        );

        // Click Player One to deselect them
        fireEvent.click(screen.getByText("Player One"));
        expect(formWrapper).toHaveAttribute(
            "data-confirmtext",
            "Save Season Roster (1)",
        );
    });

    it("selects all players when Select All is clicked", () => {
        render(
            <ManageSeasonRosterDrawer
                opened={true}
                onClose={mockOnClose}
                teamPlayers={mockTeamPlayers}
                currentPlayers={mockCurrentPlayers}
                teamId="team-123"
                seasonId="season-456"
            />,
        );

        fireEvent.click(screen.getByText("Select All"));

        const formWrapper = screen.getByTestId("form-wrapper");
        expect(formWrapper).toHaveAttribute(
            "data-confirmtext",
            "Save Season Roster (2)",
        );
    });

    it("deselects all players when Deselect All is clicked", () => {
        render(
            <ManageSeasonRosterDrawer
                opened={true}
                onClose={mockOnClose}
                teamPlayers={mockTeamPlayers}
                currentPlayers={mockCurrentPlayers}
                teamId="team-123"
                seasonId="season-456"
            />,
        );

        fireEvent.click(screen.getByText("Deselect All"));

        const formWrapper = screen.getByTestId("form-wrapper");
        expect(formWrapper).toHaveAttribute(
            "data-confirmtext",
            "Save Season Roster (0)",
        );
    });

    it("sets loading state when form is submitting", () => {
        const formData = new FormData();
        formData.append("_action", "update-season-roster");
        mockUseNavigation.mockReturnValue({
            state: "submitting",
            formData,
        });

        render(
            <ManageSeasonRosterDrawer
                opened={true}
                onClose={mockOnClose}
                teamPlayers={mockTeamPlayers}
                currentPlayers={mockCurrentPlayers}
                teamId="team-123"
                seasonId="season-456"
            />,
        );

        const formWrapper = screen.getByTestId("form-wrapper");
        expect(formWrapper).toHaveAttribute("data-loading", "true");
    });
});
