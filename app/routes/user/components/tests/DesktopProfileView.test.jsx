import { render, screen } from "@/utils/test-utils";
import DesktopProfileView from "../DesktopProfileView";

jest.mock("react-router", () => {
    const actual = jest.requireActual("react-router");
    return {
        ...actual,
        useFetcher: jest.fn(() => ({
            state: "idle",
            data: { logs: [], games: [], teams: [] },
            load: jest.fn(),
        })),
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

// Mock observers typically needed by Mantine components like Carousel
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

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
