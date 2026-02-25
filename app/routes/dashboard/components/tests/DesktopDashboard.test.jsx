import { BrowserRouter } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import DesktopDashboard from "../DesktopDashboard";

describe("DesktopDashboard Component", () => {
    const mockTeamList = [
        {
            $id: "team-1",
            name: "Team One",
            primaryColor: "#FF0000",
            games: [
                {
                    $id: "game-1",
                    teamId: "team-1",
                    opponent: "Opponent A",
                    type: "game",
                    gameDate: new Date(Date.now() + 86400000).toISOString(),
                },
            ],
        },
        {
            $id: "team-2",
            name: "Team Two",
            primaryColor: "#00FF00",
            games: [
                {
                    $id: "game-2",
                    teamId: "team-2",
                    opponent: "Opponent B",
                    type: "game",
                    gameDate: new Date(Date.now() + 86400000).toISOString(),
                },
            ],
        },
    ];

    const mockOpenAddTeamModal = jest.fn();

    const renderDashboard = (teamList = mockTeamList) => {
        return render(
            <BrowserRouter>
                <DesktopDashboard
                    teamList={teamList}
                    openAddTeamModal={mockOpenAddTeamModal}
                />
            </BrowserRouter>,
        );
    };

    it("renders tabs for each team", () => {
        renderDashboard();
        expect(
            screen.getByRole("tab", { name: "Team One" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("tab", { name: "Team Two" }),
        ).toBeInTheDocument();
    });

    it("renders 'Add Team' button and calls openAddTeamModal on click", () => {
        renderDashboard();
        const addButton = screen.getByText("Add Team");
        expect(addButton).toBeInTheDocument();
        fireEvent.click(addButton);
        expect(mockOpenAddTeamModal).toHaveBeenCalledTimes(1);
    });

    it("displays content for the active team and switches tabs correctly", () => {
        renderDashboard();
        // Check for opponent text rendered by GameCard on active tab
        expect(screen.getAllByText(/Opponent A/i).length).toBeGreaterThan(0);

        // Opponent B should not be visible yet
        expect(screen.queryByText(/Opponent B/i)).not.toBeInTheDocument();

        // Switch to the Team Two tab
        fireEvent.click(screen.getByRole("tab", { name: "Team Two" }));

        // Now Opponent B should be visible
        expect(screen.getAllByText(/Opponent B/i).length).toBeGreaterThan(0);
    });

    it("displays empty state when there are no teams", () => {
        renderDashboard([]);
        expect(
            screen.getByText("You don't have any teams yet."),
        ).toBeInTheDocument();
    });
});
