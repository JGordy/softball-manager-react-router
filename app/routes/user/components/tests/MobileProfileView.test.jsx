import { render, screen } from "@/utils/test-utils";
import MobileProfileView from "../MobileProfileView";

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

describe("MobileProfileView", () => {
    const mockProps = {
        tab: "player",
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
    };

    it("renders PersonalDetails and PlayerDetails when tab is player", () => {
        render(<MobileProfileView {...mockProps} />);
        expect(screen.getByText("test@example.com")).toBeInTheDocument();
        expect(screen.getByText("Fielding Preferences")).toBeInTheDocument();
    });

    it("renders PlayerStats when tab is stats", () => {
        render(<MobileProfileView {...mockProps} tab="stats" />);
        expect(screen.getByText("No stats available yet.")).toBeInTheDocument();
    });

    it("renders PlayerAwards when tab is awards", () => {
        render(<MobileProfileView {...mockProps} tab="awards" />);
        expect(screen.getByText(/awards yet/i)).toBeInTheDocument();
    });
});
