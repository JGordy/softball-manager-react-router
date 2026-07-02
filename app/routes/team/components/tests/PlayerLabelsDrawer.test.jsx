import { useFetcher } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";

import PlayerLabelsDrawer from "../PlayerLabelsDrawer";

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useFetcher: jest.fn(),
}));

describe("PlayerLabelsDrawer", () => {
    const mockOnClose = jest.fn();
    const mockSubmit = jest.fn();

    const mockTeam = {
        $id: "team1",
        prefs: {
            playerLabels: {
                p1: ["Power"],
            },
        },
    };

    const mockPlayers = [
        { $id: "p1", firstName: "Dan", lastName: "Soltis" },
        { $id: "p2", firstName: "Joseph", lastName: "Gordy" },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        useFetcher.mockReturnValue({
            state: "idle",
            data: null,
            submit: mockSubmit,
            Form: ({ children, onSubmit }) => (
                <form onSubmit={onSubmit} data-testid="fetcher-form">
                    {children}
                </form>
            ),
        });
    });

    it("renders with players and their labels", () => {
        render(
            <PlayerLabelsDrawer
                opened={true}
                onClose={mockOnClose}
                team={mockTeam}
                players={mockPlayers}
            />,
        );

        expect(screen.getByText("Dan Soltis")).toBeInTheDocument();
        expect(screen.getByText("Joseph Gordy")).toBeInTheDocument();

        // Check if power label is active for p1 (light variant means active usually, we can just check if button exists)
        const powerButtons = screen.getAllByRole("button", { name: "Power" });
        expect(powerButtons).toHaveLength(2);
    });

    it("allows toggling a label and submits", () => {
        render(
            <PlayerLabelsDrawer
                opened={true}
                onClose={mockOnClose}
                team={mockTeam}
                players={mockPlayers}
            />,
        );

        // Click On Base for p1
        const onBaseButtons = screen.getAllByRole("button", {
            name: "On Base",
        });
        fireEvent.click(onBaseButtons[0]);

        // Submit form
        fireEvent.submit(screen.getByTestId("fetcher-form"));

        expect(mockSubmit).toHaveBeenCalledWith(
            {
                _action: "update-player-labels",
                labels: {
                    p1: ["Power", "On Base"],
                },
            },
            {
                method: "post",
                action: "/team/team1",
                encType: "application/json",
            },
        );
    });

    it("closes when submission is successful", () => {
        useFetcher.mockReturnValue({
            state: "idle",
            data: { success: true },
            submit: mockSubmit,
            Form: ({ children }) => <form>{children}</form>,
        });

        render(
            <PlayerLabelsDrawer
                opened={true}
                onClose={mockOnClose}
                team={mockTeam}
                players={mockPlayers}
            />,
        );

        expect(mockOnClose).toHaveBeenCalled();
    });
});
