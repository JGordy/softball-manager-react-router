import React from "react";
import { MemoryRouter } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import DesktopDashboard from "../DesktopDashboard";
import * as getGamesUtils from "@/utils/getGames";
import * as dateTimeUtils from "@/utils/dateTime";

jest.mock("@/utils/getGames");
jest.mock("@/utils/dateTime");

describe("DesktopDashboard Component", () => {
    const mockTeamList = [
        {
            $id: "team-1",
            name: "Team One",
            primaryColor: "#FF0000",
            isManager: true,
            games: [],
        },
        {
            $id: "team-non-manager",
            name: "Non-Manager Team",
            primaryColor: "#00FF00",
            isManager: false,
            games: [],
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

    beforeEach(() => {
        jest.clearAllMocks();
        getGamesUtils.default.mockImplementation(({ teams, teamId }) => ({
            futureGames: [],
            pastGames: [],
        }));
        dateTimeUtils.getGameDayStatus.mockReturnValue("future");
    });

    it("displays upcoming games with appropriate manager actions", () => {
        getGamesUtils.default.mockReturnValue({
            futureGames: [
                {
                    $id: "upcoming-1",
                    opponent: "Upcoming Opponent",
                    gameDate: "2025-01-01",
                    hasLineup: false,
                },
                {
                    $id: "in-progress-1",
                    opponent: "Live Opponent",
                    gameDate: "2025-01-01",
                    hasLineup: true,
                },
            ],
            pastGames: [],
        });

        // Mock the second game as in-progress
        dateTimeUtils.getGameDayStatus
            .mockReturnValueOnce("future")
            .mockReturnValueOnce("in progress");

        renderDashboard();

        expect(screen.getByText("Upcoming Games")).toBeInTheDocument();
        expect(screen.getByText(/Upcoming Opponent/i)).toBeInTheDocument();
        expect(screen.getByText("Create Lineup")).toBeInTheDocument();

        expect(screen.getByText(/Live Opponent/i)).toBeInTheDocument();
        expect(screen.getByText("Edit Lineup")).toBeInTheDocument();
        expect(screen.getByText("Go Live")).toBeInTheDocument();
    });

    it("displays recent results with appropriate actions", () => {
        getGamesUtils.default.mockReturnValue({
            futureGames: [],
            pastGames: [
                {
                    $id: "past-1",
                    opponent: "Past Opponent",
                    gameDate: "2023-01-01",
                },
            ],
        });

        renderDashboard();

        expect(screen.getByText("Recent Results")).toBeInTheDocument();
        expect(screen.getByText(/Past Opponent/i)).toBeInTheDocument();
        expect(screen.getByText("See Awards")).toBeInTheDocument();
        expect(screen.getByText("Recap")).toBeInTheDocument();
    });

    it("hides manager-only actions for non-managers", () => {
        getGamesUtils.default.mockReturnValue({
            futureGames: [
                {
                    $id: "game-1",
                    opponent: "Hidden Opponent",
                    gameDate: "2025-01-01",
                },
            ],
            pastGames: [],
        });

        renderDashboard([mockTeamList[1]]); // Non-Manager Team

        expect(screen.getByText(/Hidden Opponent/i)).toBeInTheDocument();
        expect(screen.queryByText("Create Lineup")).not.toBeInTheDocument();
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
