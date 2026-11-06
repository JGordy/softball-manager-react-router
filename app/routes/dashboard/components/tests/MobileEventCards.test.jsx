import { MemoryRouter } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";
import { UpcomingEventCard, MostRecentGameCard } from "../MobileEventCards";

describe("MobileEventCards", () => {
    const mockActiveTeam = {
        $id: "team-1",
        name: "Ormewood Park Sliders",
        isManager: true,
    };

    describe("UpcomingEventCard", () => {
        const mockUpcomingGame = {
            $id: "game-101",
            opponent: "East Atlanta",
            gameDate: "2026-11-15T19:45:00.000Z",
            timeZone: "UTC",
            hasLineup: false,
            eventType: "game",
            location: "Coan Park",
        };

        it("renders countdown pill, matchup title, and primary CTA for manager", () => {
            render(
                <MemoryRouter>
                    <UpcomingEventCard
                        game={mockUpcomingGame}
                        activeTeam={mockActiveTeam}
                        onRsvpClick={jest.fn()}
                    />
                </MemoryRouter>,
            );

            expect(screen.getByText(/East Atlanta/i)).toBeInTheDocument();
            expect(screen.getByText("Create Lineup")).toBeInTheDocument();
            expect(
                screen.getByRole("button", { name: "RSVP" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("button", { name: "Venue location" }),
            ).toBeInTheDocument();
        });

        it("renders Edit Lineup when game already has a lineup", () => {
            render(
                <MemoryRouter>
                    <UpcomingEventCard
                        game={{ ...mockUpcomingGame, hasLineup: true }}
                        activeTeam={mockActiveTeam}
                    />
                </MemoryRouter>,
            );

            expect(screen.getByText("Edit Lineup")).toBeInTheDocument();
        });

        it("calls onRsvpClick when RSVP button is clicked", () => {
            const handleRsvpClick = jest.fn();
            render(
                <MemoryRouter>
                    <UpcomingEventCard
                        game={mockUpcomingGame}
                        activeTeam={mockActiveTeam}
                        onRsvpClick={handleRsvpClick}
                    />
                </MemoryRouter>,
            );

            const rsvpButton = screen.getByRole("button", { name: "RSVP" });
            expect(rsvpButton).toBeInTheDocument();
            fireEvent.click(rsvpButton);
            expect(handleRsvpClick).toHaveBeenCalledTimes(1);
        });

        it("renders 'Attending' when attendanceStatus is 'accepted'", () => {
            render(
                <MemoryRouter>
                    <UpcomingEventCard
                        game={mockUpcomingGame}
                        activeTeam={mockActiveTeam}
                        attendanceStatus="accepted"
                        onRsvpClick={jest.fn()}
                    />
                </MemoryRouter>,
            );

            expect(
                screen.getByRole("button", { name: "Attending" }),
            ).toBeInTheDocument();
        });

        it("renders 'Not Attending' when attendanceStatus is 'declined'", () => {
            render(
                <MemoryRouter>
                    <UpcomingEventCard
                        game={mockUpcomingGame}
                        activeTeam={mockActiveTeam}
                        attendanceStatus="declined"
                        onRsvpClick={jest.fn()}
                    />
                </MemoryRouter>,
            );

            expect(
                screen.getByRole("button", { name: "Not Attending" }),
            ).toBeInTheDocument();
        });

        it("renders 'Maybe' when attendanceStatus is 'tentative'", () => {
            render(
                <MemoryRouter>
                    <UpcomingEventCard
                        game={mockUpcomingGame}
                        activeTeam={mockActiveTeam}
                        attendanceStatus="tentative"
                        onRsvpClick={jest.fn()}
                    />
                </MemoryRouter>,
            );

            expect(
                screen.getByRole("button", { name: "Maybe" }),
            ).toBeInTheDocument();
        });

        it("renders an accessible overlay link navigating to the event details", () => {
            render(
                <MemoryRouter>
                    <UpcomingEventCard
                        game={mockUpcomingGame}
                        activeTeam={mockActiveTeam}
                    />
                </MemoryRouter>,
            );

            const cardLink = screen.getByRole("link", {
                name: /view details for ormewood park sliders @ east atlanta/i,
            });
            expect(cardLink).toBeInTheDocument();
            expect(cardLink).toHaveAttribute(
                "href",
                `/events/${mockUpcomingGame.$id}`,
            );
        });
    });

    describe("MostRecentGameCard", () => {
        const mockPastGame = {
            $id: "game-102",
            opponent: "Edgewood",
            gameDate: "2026-11-01T17:15:00.000Z",
            timeZone: "UTC",
            score: 19,
            opponentScore: 27,
            result: "lost",
            eventType: "game",
        };

        it("renders result pill, matchup, Recap CTA, and Awards bubble", () => {
            render(
                <MemoryRouter>
                    <MostRecentGameCard
                        game={mockPastGame}
                        activeTeam={mockActiveTeam}
                    />
                </MemoryRouter>,
            );

            expect(screen.getByText("LOST 19-27")).toBeInTheDocument();
            expect(screen.getByText(/Edgewood/i)).toBeInTheDocument();
            expect(screen.getByText("Recap")).toBeInTheDocument();
            expect(screen.getByText("See Awards")).toBeInTheDocument();
            expect(
                screen.getByRole("button", { name: "Share match result" }),
            ).toBeInTheDocument();
        });

        it("renders an accessible overlay link navigating to the event details", () => {
            render(
                <MemoryRouter>
                    <MostRecentGameCard
                        game={mockPastGame}
                        activeTeam={mockActiveTeam}
                    />
                </MemoryRouter>,
            );

            const cardLink = screen.getByRole("link", {
                name: /view details for ormewood park sliders @ edgewood/i,
            });
            expect(cardLink).toBeInTheDocument();
            expect(cardLink).toHaveAttribute(
                "href",
                `/events/${mockPastGame.$id}`,
            );
        });
    });
});
