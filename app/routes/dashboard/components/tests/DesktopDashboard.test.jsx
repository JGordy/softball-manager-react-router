import React from "react";
import { MemoryRouter } from "react-router";
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

    const DashboardWrapper = ({
        teamList,
        initialTeamId,
        openAddTeamModal,
    }) => {
        const [activeTeamId, setActiveTeamId] = React.useState(initialTeamId);
        return (
            <MemoryRouter>
                <DesktopDashboard
                    teamList={teamList}
                    activeTeamId={activeTeamId}
                    setActiveTeamId={setActiveTeamId}
                    openAddTeamModal={openAddTeamModal}
                />
            </MemoryRouter>
        );
    };

    const renderDashboard = (teamList = mockTeamList) => {
        return render(
            <DashboardWrapper
                teamList={teamList}
                initialTeamId={teamList.length > 0 ? teamList[0].$id : null}
                openAddTeamModal={mockOpenAddTeamModal}
            />,
        );
    };

    it("displays content for the active team", () => {
        renderDashboard();

        // Check for title
        expect(
            screen.getByText("Season Schedule overview"),
        ).toBeInTheDocument();

        // Check for opponent text rendered by GameCard on active team
        expect(screen.getAllByText(/Opponent A/i).length).toBeGreaterThan(0);

        // Opponent B should not be visible
        expect(screen.queryByText(/Opponent B/i)).not.toBeInTheDocument();

        // Check for details button
        expect(screen.getByText("View Full Team Details")).toBeInTheDocument();
    });

    it("displays empty state when there are no teams", () => {
        renderDashboard([]);
        expect(
            screen.getByText("You don't have any teams yet."),
        ).toBeInTheDocument();
        const createButton = screen.getByText("Create your first team");
        expect(createButton).toBeInTheDocument();
        fireEvent.click(createButton);
        expect(mockOpenAddTeamModal).toHaveBeenCalledTimes(1);
    });
});
