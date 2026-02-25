import { BrowserRouter } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import MobileDashboard from "../MobileDashboard";

describe("MobileDashboard Component", () => {
    const mockTeamList = [
        {
            $id: "team-1",
            name: "Team One",
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
        },
    ];

    const mockOpenAddTeamModal = jest.fn();

    const renderDashboard = (teamList = mockTeamList) => {
        return render(
            <BrowserRouter>
                <MobileDashboard
                    teamList={teamList}
                    openAddTeamModal={mockOpenAddTeamModal}
                />
            </BrowserRouter>,
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders team cards in a carousel", () => {
        renderDashboard();
        expect(screen.getAllByText("Team One").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Team Two").length).toBeGreaterThan(0);
    });

    it("renders Create your first team button when no teams", () => {
        renderDashboard([]);
        const addCard = screen.getByText("Create your first team");
        expect(addCard).toBeInTheDocument();

        const container = addCard.closest("button");
        if (container) {
            fireEvent.click(container);
            expect(mockOpenAddTeamModal).toHaveBeenCalledTimes(1);
        }
    });

    it("displays content for the selected team", () => {
        renderDashboard();
        // Since we unmocked the components, just verify actual text is present
        expect(screen.getByText(/Opponent A/i)).toBeInTheDocument();
    });

    it("displays empty state when there are no teams", () => {
        renderDashboard([]);
        expect(screen.getByText("Create your first team")).toBeInTheDocument();
    });
});
