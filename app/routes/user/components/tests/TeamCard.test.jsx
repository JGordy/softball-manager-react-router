import { MemoryRouter } from "react-router";
import { DateTime } from "luxon";

import { render, screen } from "@/utils/test-utils";

import TeamCard from "../TeamCard";

describe("TeamCard Component", () => {
    const mockTeam = {
        $id: "team-1",
        name: "Test Team",
        primaryColor: "#ff0000",
        seasons: [
            {
                $id: "season-1",
                startDate: DateTime.now().plus({ days: 5 }).toISODate(),
                endDate: DateTime.now().plus({ months: 3 }).toISODate(),
            },
        ],
    };

    it("renders team name and points to correct URL", () => {
        render(
            <MemoryRouter>
                <TeamCard team={mockTeam} />
            </MemoryRouter>,
        );

        expect(screen.getByText("Test Team")).toBeInTheDocument();
        expect(screen.getByRole("link")).toHaveAttribute(
            "href",
            "/team/team-1",
        );
    });

    it("displays 'Season starts in 5 days' when season starts shortly", () => {
        render(
            <MemoryRouter>
                <TeamCard team={mockTeam} />
            </MemoryRouter>,
        );

        expect(screen.getByText(/Season starts in/i)).toBeInTheDocument();
        expect(screen.getByText("5 days")).toBeInTheDocument();
    });

    it("displays 'Season in progress' when today is between start and end dates", () => {
        const activeTeam = {
            ...mockTeam,
            seasons: [
                {
                    $id: "season-active",
                    startDate: DateTime.now().minus({ days: 1 }).toISODate(),
                    endDate: DateTime.now().plus({ days: 1 }).toISODate(),
                },
            ],
        };

        render(
            <MemoryRouter>
                <TeamCard team={activeTeam} />
            </MemoryRouter>,
        );

        expect(screen.getByText("Season in progress")).toBeInTheDocument();
    });

    it("displays 'No upcoming seasons' if seasons array is empty", () => {
        const noSeasonTeam = { ...mockTeam, seasons: [] };

        render(
            <MemoryRouter>
                <TeamCard team={noSeasonTeam} />
            </MemoryRouter>,
        );

        expect(screen.getByText("No upcoming seasons")).toBeInTheDocument();
    });
});
