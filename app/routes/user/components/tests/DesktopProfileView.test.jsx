import { render, screen } from "@/utils/test-utils";
import DesktopProfileView from "../DesktopProfileView";

jest.mock("react-router", () => {
    const actual = jest.requireActual("react-router");
    return {
        ...actual,
        useNavigate: jest.fn(() => jest.fn()),
        Link: ({ children, to }) => <a href={to}>{children}</a>,
    };
});

jest.mock("@/components/DeferredLoader", () => ({
    __esModule: true,
    default: ({ resolve, children, fallback }) => {
        if (!resolve) return fallback;
        return children(Array.isArray(resolve) ? resolve : []);
    },
}));

describe("DesktopProfileView", () => {
    const mockProps = {
        tab: "stats",
        handleTabChange: jest.fn(),
        player: {
            $id: "player1",
            throws: "Right",
            bats: "Right",
            preferredPositions: [],
            dislikedPositions: [],
            email: "test@example.com",
        },
        loggedInUser: { $id: "player1" },
        awardsPromise: Promise.resolve([]),
        attendancePromise: Promise.resolve([]),
        statsPromise: Promise.resolve({ logs: [], games: [], teams: [] }),
    };

    it("renders PersonalDetails and PlayerDetails", () => {
        render(<DesktopProfileView {...mockProps} />);
        expect(screen.getByText("test@example.com")).toBeInTheDocument();
        expect(screen.getByText("Fielding Preferences")).toBeInTheDocument();
    });

    it("renders PlayerStats by default when tab is stats", () => {
        render(<DesktopProfileView {...mockProps} />);
        expect(screen.getByText("No stats available yet.")).toBeInTheDocument();
    });

    it("renders PlayerAwards when tab is awards", () => {
        render(<DesktopProfileView {...mockProps} tab="awards" />);
        expect(screen.getByText(/awards yet/i)).toBeInTheDocument();
    });

    it("renders PlayerAttendance when tab is attendance", () => {
        render(<DesktopProfileView {...mockProps} tab="attendance" />);
        expect(
            screen.getByText("No attendance records found."),
        ).toBeInTheDocument();
    });
});
