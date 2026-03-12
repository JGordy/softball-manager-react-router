import { render, screen } from "@/utils/test-utils";
import MobileProfileView from "../MobileProfileView";

jest.mock("react-router", () => {
    const actual = jest.requireActual("react-router");
    return {
        ...actual,
        useNavigate: jest.fn(() => jest.fn()),
        useOutletContext: jest.fn(() => ({ isDesktop: false })),
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
        statsPromise: Promise.resolve({ logs: [], games: [], teams: [] }),
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

    it("renders Alert when stats are private and user is not owner", () => {
        const privatePlayer = {
            ...mockProps.player,
            prefs: { statsPrivacy: "private" },
        };
        const otherUser = { $id: "otherUser" };

        render(
            <MobileProfileView
                {...mockProps}
                player={privatePlayer}
                loggedInUser={otherUser}
                tab="stats"
            />,
        );

        expect(screen.getByText("Stats are Private")).toBeInTheDocument();
        expect(
            screen.queryByText("No stats available yet."),
        ).not.toBeInTheDocument();
    });
});
