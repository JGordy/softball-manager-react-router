import { render, screen, fireEvent } from "@/utils/test-utils";

import PlayerList from "../PlayerList";

jest.mock("@/components/ContactSprayChart", () => () => (
    <div data-testid="spray-chart" />
));

jest.mock(
    "@/components/DrawerContainer",
    () =>
        ({ children, opened, title }) =>
            opened ? (
                <div data-testid="drawer" data-title={title}>
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

describe("PlayerList Component", () => {
    const mockPlayers = [
        {
            $id: "p1",
            firstName: "John",
            lastName: "Doe",
            preferredPositions: ["Pitcher", "Shortstop"],
        },
        {
            $id: "p2",
            firstName: "Jane",
            lastName: "Smith",
            preferredPositions: ["Catcher"],
        },
    ];
    const mockManagerIds = ["p1"];
    const mockUser = { $id: "p1" };

    it("renders empty state when no players", () => {
        render(<PlayerList players={[]} managerIds={[]} />);
        expect(
            screen.getByText("No players currently listed for this team."),
        ).toBeInTheDocument();
    });

    it("renders list of players", () => {
        render(
            <PlayerList players={mockPlayers} managerIds={mockManagerIds} />,
        );
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("opens drawer when player is clicked", () => {
        render(
            <PlayerList
                players={mockPlayers}
                managerIds={mockManagerIds}
                user={mockUser}
            />,
        );

        fireEvent.click(screen.getByText("John Doe"));

        expect(screen.getByTestId("drawer")).toBeInTheDocument();
        expect(screen.getByTestId("drawer")).toHaveAttribute(
            "data-title",
            "John's Details",
        );
        expect(screen.getByTestId("player-details")).toBeInTheDocument();
    });

    it("renders personal details tab when selected", () => {
        render(
            <PlayerList
                players={mockPlayers}
                managerIds={mockManagerIds}
                user={mockUser}
            />,
        );

        fireEvent.click(screen.getByText("John Doe"));
        fireEvent.click(screen.getByText("Personal"));

        expect(screen.getByTestId("personal-details")).toBeInTheDocument();
    });

    it("renders spray chart tab when selected", () => {
        render(
            <PlayerList
                players={mockPlayers}
                managerIds={mockManagerIds}
                user={mockUser}
            />,
        );

        fireEvent.click(screen.getByText("John Doe"));
        fireEvent.click(screen.getByText("Charts"));

        expect(screen.getByTestId("spray-chart")).toBeInTheDocument();
    });
});
