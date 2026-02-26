import { render, screen, fireEvent } from "@/utils/test-utils";
import PlayerDetailsDrawer from "../PlayerDetailsDrawer";

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

describe("PlayerDetailsDrawer Component", () => {
    const mockPlayer = {
        $id: "p1",
        firstName: "John",
        lastName: "Doe",
    };

    const mockProps = {
        opened: true,
        close: jest.fn(),
        selectedPlayer: mockPlayer,
        user: { $id: "u1" },
        managerView: true,
        playerHits: [],
        size: "md",
    };

    it("returns null if no selectedPlayer is provided", () => {
        render(<PlayerDetailsDrawer {...mockProps} selectedPlayer={null} />);
        expect(
            screen.queryByTestId("drawer-container"),
        ).not.toBeInTheDocument();
    });

    it("renders drawer with correct title when opened", () => {
        render(<PlayerDetailsDrawer {...mockProps} />);
        expect(screen.getByTestId("drawer-container")).toBeInTheDocument();
        expect(screen.getByText("John's Details")).toBeInTheDocument();
    });

    it("does not render drawer when opened is false", () => {
        render(<PlayerDetailsDrawer {...mockProps} opened={false} />);
        expect(
            screen.queryByTestId("drawer-container"),
        ).not.toBeInTheDocument();
    });

    it("renders all tabs and initial player content", () => {
        render(<PlayerDetailsDrawer {...mockProps} />);

        // Check tabs exist
        expect(screen.getByText("Player")).toBeInTheDocument();
        expect(screen.getByText("Personal")).toBeInTheDocument();
        expect(screen.getByText("Charts")).toBeInTheDocument();

        // Check default active content
        expect(screen.getByTestId("player-details")).toBeInTheDocument();
    });
});
