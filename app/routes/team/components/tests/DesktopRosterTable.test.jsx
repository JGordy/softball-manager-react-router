import { render, screen, fireEvent } from "@/utils/test-utils";
import DesktopRosterTable from "../DesktopRosterTable";

// Mock sub-components
jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, opened, title }) =>
            opened ? (
                <div data-testid="drawer-container">
                    <div>{title}</div>
                    {children}
                </div>
            ) : null,
);
jest.mock("@/components/PlayerDetails", () => () => (
    <div data-testid="player-details" />
));
jest.mock("@/components/PersonalDetails", () => () => (
    <div data-testid="personal-details" />
));
jest.mock("@/components/ContactSprayChart", () => () => (
    <div data-testid="contact-spray-chart" />
));

describe("DesktopRosterTable Component", () => {
    const mockPlayers = [
        {
            $id: "p1",
            firstName: "John",
            lastName: "Doe",
            email: "john@test.com",
            gender: "Male",
            preferredPositions: ["Shortstop"],
        },
        {
            $id: "p2",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@test.com",
            gender: "Female",
            preferredPositions: [
                "First Base",
                "Second Base",
                "Third Base",
                "Right Field",
                "Right Center Field",
            ],
        },
    ];

    const mockProps = {
        players: mockPlayers,
        managerIds: ["p1"],
        managerView: true,
        user: { $id: "p1" },
        teamLogs: [],
    };

    it("renders empty state when no players provided", () => {
        render(<DesktopRosterTable {...mockProps} players={[]} />);
        expect(
            screen.getByText("No players currently listed for this team."),
        ).toBeInTheDocument();
    });

    it("renders roster table with player rows", () => {
        render(<DesktopRosterTable {...mockProps} />);

        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("jane@test.com")).toBeInTheDocument();

        // John is a manager
        expect(screen.getByText("Manager")).toBeInTheDocument();
        // Jane is a player
        expect(screen.getByText("Player")).toBeInTheDocument();

        // Check overflow positions for Jane (+2)
        expect(screen.getByText("+2")).toBeInTheDocument();
    });

    it("opens player details drawer on row click", () => {
        render(<DesktopRosterTable {...mockProps} />);

        // Initially closed
        expect(
            screen.queryByTestId("drawer-container"),
        ).not.toBeInTheDocument();

        // Click row
        fireEvent.click(screen.getByText("John Doe").closest("tr"));

        // Drawer opens
        expect(screen.getByTestId("drawer-container")).toBeInTheDocument();
        expect(screen.getByText("John's Details")).toBeInTheDocument();
        expect(screen.getByTestId("player-details")).toBeInTheDocument();
    });
});
