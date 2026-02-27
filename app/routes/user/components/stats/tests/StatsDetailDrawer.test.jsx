import { render, screen } from "@/utils/test-utils";

import { UI_KEYS } from "@/constants/scoring";

import StatsDetailDrawer from "../StatsDetailDrawer";

jest.mock("@/components/DrawerContainer", () => ({
    __esModule: true,
    default: ({ children, opened, title }) =>
        opened ? (
            <div data-testid="drawer">
                <h2>{title}</h2>
                {children}
            </div>
        ) : null,
}));

jest.mock("react-router", () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

describe("StatsDetailDrawer Component", () => {
    const mockGame = {
        $id: "game-1",
        gameDate: "2023-10-15T18:00:00Z",
        team: { name: "Thunder" },
        opponent: "Lightning",
    };

    const mockLogs = [
        { eventType: UI_KEYS.SINGLE, rbi: 1 },
        { eventType: UI_KEYS.HOMERUN, rbi: 4 },
        { eventType: UI_KEYS.FLY_OUT, rbi: 0 },
    ];

    it("renders nothing if game is missing", () => {
        render(
            <StatsDetailDrawer
                opened={true}
                onClose={() => {}}
                game={null}
                logs={[]}
            />,
        );
        expect(screen.queryByTestId("drawer")).not.toBeInTheDocument();
    });

    it("renders nothing if opened is false", () => {
        render(
            <StatsDetailDrawer
                opened={false}
                onClose={() => {}}
                game={mockGame}
                logs={mockLogs}
            />,
        );
        expect(screen.queryByTestId("drawer")).not.toBeInTheDocument();
    });

    it("renders detailed stats when opened", () => {
        render(
            <StatsDetailDrawer
                opened={true}
                onClose={() => {}}
                game={mockGame}
                logs={mockLogs}
            />,
        );

        expect(screen.getByText("Thunder vs Lightning")).toBeInTheDocument();
        expect(screen.getByText("2 for 3")).toBeInTheDocument();

        // Check table rows
        expect(screen.getByText("At Bats")).toBeInTheDocument();
        expect(screen.getByText("Home Runs")).toBeInTheDocument();

        // Check RBI - it should sum to 5 (1 + 4)
        const rbiTds = screen.getAllByRole("cell");
        expect(rbiTds.some((td) => td.textContent === "RBI")).toBeTruthy();
        expect(rbiTds.some((td) => td.textContent === "5")).toBeTruthy();
    });

    it("displays calculated averages", () => {
        render(
            <StatsDetailDrawer
                opened={true}
                onClose={() => {}}
                game={mockGame}
                logs={mockLogs}
            />,
        );

        expect(screen.getByText("AVG")).toBeInTheDocument();
        expect(screen.getByText("OBP")).toBeInTheDocument();
        expect(screen.getByText("SLG")).toBeInTheDocument();
        expect(screen.getByText("OPS")).toBeInTheDocument();
    });

    it("renders See Game Details button", () => {
        render(
            <StatsDetailDrawer
                opened={true}
                onClose={() => {}}
                game={mockGame}
                logs={mockLogs}
            />,
        );

        const linkBtn = screen.getByRole("link", { name: /see game details/i });
        expect(linkBtn).toBeInTheDocument();
        expect(linkBtn).toHaveAttribute("href", "/events/game-1?open=awards");
    });
});
