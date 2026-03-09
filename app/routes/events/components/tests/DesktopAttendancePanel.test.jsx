import { render, screen } from "@/utils/test-utils";
import DesktopAttendancePanel from "../DesktopAttendancePanel";

jest.mock("react-router", () => ({
    useOutletContext: jest.fn(() => ({ user: { $id: "user-p1" } })),
    useFetcher: jest.fn(() => ({
        state: "idle",
        data: null,
        submit: jest.fn(),
    })),
}));

jest.mock(
    "@/components/DeferredLoader",
    () =>
        function MockDeferredLoader({ children, resolve }) {
            // Synchronously call children with mock resolved data
            if (typeof children === "function") {
                return children({
                    attendance: {
                        rows: [
                            { playerId: "p1", status: "accepted" },
                            { playerId: "p2", status: "declined" },
                        ],
                    },
                    players: [
                        {
                            $id: "p1",
                            firstName: "Alice",
                            lastName: "Smith",
                            preferredPositions: ["SS"],
                        },
                        {
                            $id: "p2",
                            firstName: "Bob",
                            lastName: "Jones",
                            preferredPositions: ["P"],
                        },
                    ],
                });
            }
            return null;
        },
);

jest.mock("@/components/InlineError", () => ({ message }) => (
    <div data-testid="inline-error">{message}</div>
));

jest.mock("@/utils/analytics", () => ({ trackEvent: jest.fn() }));

jest.mock("@/utils/addPlayerAvailability", () =>
    jest.fn((rows, players) =>
        players.map((p) => {
            const row = rows.find((r) => r.playerId === p.$id);
            return { ...p, availability: row?.status ?? "unknown" };
        }),
    ),
);

const defaultGame = {
    $id: "game1",
    gameDate: "2030-03-08T18:30:00Z",
    timeZone: "America/New_York",
};

describe("DesktopAttendancePanel", () => {
    beforeEach(() => jest.clearAllMocks());

    it("renders player names", () => {
        render(
            <DesktopAttendancePanel
                deferredData={Promise.resolve({})}
                game={defaultGame}
                managerView={false}
                team={{ $id: "team1" }}
            />,
        );
        expect(screen.getByText("Alice Smith")).toBeInTheDocument();
        expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    });

    it("shows status summary badges", () => {
        render(
            <DesktopAttendancePanel
                deferredData={Promise.resolve({})}
                game={defaultGame}
                managerView={false}
                team={{ $id: "team1" }}
            />,
        );
        // 1 accepted (Alice), 1 declined (Bob)
        expect(screen.getByText("1 Yes")).toBeInTheDocument();
        expect(screen.getByText("1 No")).toBeInTheDocument();
    });

    it("shows Your Attendance heading for non-manager", () => {
        render(
            <DesktopAttendancePanel
                deferredData={Promise.resolve({})}
                game={defaultGame}
                managerView={false}
                team={{ $id: "team1" }}
            />,
        );
        expect(screen.getByText("Your Attendance")).toBeInTheDocument();
    });

    it("shows Manage Attendance heading for manager", () => {
        render(
            <DesktopAttendancePanel
                deferredData={Promise.resolve({})}
                game={defaultGame}
                managerView={true}
                team={{ $id: "team1" }}
            />,
        );
        expect(screen.getByText("Manage Attendance")).toBeInTheDocument();
    });

    it("shows inline Yes/No/Maybe buttons for the current player row", () => {
        render(
            <DesktopAttendancePanel
                deferredData={Promise.resolve({})}
                game={defaultGame}
                managerView={false}
                team={{ $id: "team1" }}
            />,
        );
        // Current user = user-p1 = Alice — should see action buttons on her row
        const yesButtons = screen.getAllByText("Yes");
        // At minimum the Alice row should have Yes (may be filled as active)
        expect(yesButtons.length).toBeGreaterThan(0);
    });

    it("shows all inline buttons for a manager", () => {
        render(
            <DesktopAttendancePanel
                deferredData={Promise.resolve({})}
                game={defaultGame}
                managerView={true}
                team={{ $id: "team1" }}
            />,
        );
        // Both rows editable — should have multiple Yes/No/Maybe buttons
        const noButtons = screen.getAllByText("No");
        expect(noButtons.length).toBeGreaterThanOrEqual(2);
    });
});
