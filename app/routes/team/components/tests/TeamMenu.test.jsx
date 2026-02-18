import { useNavigate } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import useModal from "@/hooks/useModal";

import TeamMenu from "../TeamMenu";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigate: jest.fn(),
}));

jest.mock("@/hooks/useModal");

jest.mock("../ManageRolesDrawer", () => () => (
    <div data-testid="manage-roles-drawer" />
));
jest.mock("../PreferencesDrawer", () => () => (
    <div data-testid="preferences-drawer" />
));

describe("TeamMenu Component", () => {
    const mockNavigate = jest.fn();
    const mockOpenModal = jest.fn();
    const mockTeam = {
        $id: "t1",
        name: "Test Team",
        primaryColor: "blue",
        seasons: [],
    };
    const mockPlayers = [];

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
        useModal.mockReturnValue({ openModal: mockOpenModal });
    });

    it("renders the menu trigger", () => {
        render(<TeamMenu userId="u1" team={mockTeam} players={mockPlayers} />);
        // The menu trigger is an ActionIcon which is a button
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("opens Add Season modal", async () => {
        render(<TeamMenu userId="u1" team={mockTeam} players={mockPlayers} />);
        fireEvent.click(screen.getByRole("button")); // Open menu
        expect(await screen.findByText("Add Season")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Add Season"));
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Add a New Season",
            }),
        );
    });

    it("opens Add Game modal", async () => {
        render(<TeamMenu userId="u1" team={mockTeam} players={mockPlayers} />);
        fireEvent.click(screen.getByRole("button")); // Open menu
        expect(await screen.findByText("Add Game")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Add Game"));
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Add a New Game",
            }),
        );
    });

    it("opens Invite Player modal", async () => {
        render(<TeamMenu userId="u1" team={mockTeam} players={mockPlayers} />);
        fireEvent.click(screen.getByRole("button")); // Open menu
        expect(await screen.findByText("Invite Players")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Invite Players"));
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Invite Player by Email",
            }),
        );
    });

    it("navigates to lineup page when Set Lineups is clicked", async () => {
        render(<TeamMenu userId="u1" team={mockTeam} players={mockPlayers} />);
        fireEvent.click(screen.getByRole("button")); // Open menu
        expect(await screen.findByText("Set Lineups")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Set Lineups"));
        expect(mockNavigate).toHaveBeenCalledWith("/team/t1/lineup");
    });

    it("shows owner-only options if ownerView is true", async () => {
        render(
            <TeamMenu
                userId="u1"
                team={mockTeam}
                players={mockPlayers}
                ownerView={true}
            />,
        );
        fireEvent.click(screen.getByRole("button")); // Open menu
        expect(await screen.findByText("Manage Roles")).toBeInTheDocument();
        expect(screen.getByText("Preferences")).toBeInTheDocument();
    });

    it("hides owner-only options if ownerView is false", async () => {
        render(
            <TeamMenu
                userId="u1"
                team={mockTeam}
                players={mockPlayers}
                ownerView={false}
            />,
        );
        fireEvent.click(screen.getByRole("button")); // Open menu
        // We still need to wait for menu to potentially open before checking absence
        expect(await screen.findByText("Add Season")).toBeInTheDocument();
        expect(screen.queryByText("Manage Roles")).not.toBeInTheDocument();
        expect(screen.queryByText("Preferences")).not.toBeInTheDocument();
    });
});
