import { render, screen } from "@/utils/test-utils";
import { MemoryRouter } from "react-router";
import { MantineProvider } from "@mantine/core";
import theme from "@/theme";
import DesktopEventDetailsView from "../DesktopEventDetailsView";

// BackButton uses useNavigate which requires a router context
jest.mock("@/components/BackButton", () => () => <button>Back</button>);

jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useNavigation: () => ({ state: "idle" }),
    useOutletContext: () => ({ user: { $id: "user1" } }),
    useFetcher: () => ({ state: "idle", submit: jest.fn() }),
}));

describe("DesktopEventDetailsView", () => {
    const defaultProps = {
        game: { $id: "game1", gameDate: "2026-03-08T18:30:00Z" },
        deferredData: {},
        season: { $id: "season1" },
        team: { $id: "team1", name: "Team 1" },
        user: { $id: "user1" },
        weatherPromise: Promise.resolve({}),
        gameInProgress: false,
        gameIsPast: false,
        isScorekeeper: false,
        managerView: false,
        playerChart: null,
    };

    const renderWithProviders = (ui) => {
        return render(
            <MantineProvider theme={theme}>
                <MemoryRouter>{ui}</MemoryRouter>
            </MantineProvider>,
        );
    };

    it("renders the score panel, info panel, and gameday panel", () => {
        renderWithProviders(<DesktopEventDetailsView {...defaultProps} />);
        expect(screen.getByTestId("score-panel-compact")).toBeInTheDocument();
        // ...
    });

    it("renders a tab list with Attendance and Lineups tabs", () => {
        renderWithProviders(<DesktopEventDetailsView {...defaultProps} />);
        expect(
            screen.getByRole("tab", { name: /attendance/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("tab", { name: /lineups/i }),
        ).toBeInTheDocument();
    });

    it("renders the attendance and lineup panels inside the tabs area", () => {
        renderWithProviders(<DesktopEventDetailsView {...defaultProps} />);
        expect(
            screen.getByTestId("desktop-attendance-panel"),
        ).toBeInTheDocument();
        expect(screen.getByTestId("desktop-lineup-panel")).toBeInTheDocument();
    });

    it("renders awards container when gameIsPast=true", () => {
        renderWithProviders(
            <DesktopEventDetailsView {...defaultProps} gameIsPast={true} />,
        );
        expect(screen.getByTestId("awards-container")).toBeInTheDocument();
    });

    it("does NOT render awards container for upcoming games", () => {
        renderWithProviders(
            <DesktopEventDetailsView {...defaultProps} gameIsPast={false} />,
        );
        expect(
            screen.queryByTestId("awards-container"),
        ).not.toBeInTheDocument();
    });

    it("renders with gameInProgress=true without crashing", () => {
        renderWithProviders(
            <DesktopEventDetailsView {...defaultProps} gameInProgress={true} />,
        );
        expect(screen.getByText("LIVE NOW")).toBeInTheDocument();
        expect(screen.getByTestId("desktop-gameday-panel")).toBeInTheDocument();
    });

    it("shows GameMenu for manager view", () => {
        renderWithProviders(
            <DesktopEventDetailsView {...defaultProps} managerView={true} />,
        );
        expect(screen.getByTestId("menu-target-icon")).toBeInTheDocument();
    });

    it("does NOT render score panel or gameday panel for practice", () => {
        const practiceGame = { ...defaultProps.game, eventType: "practice" };
        renderWithProviders(
            <DesktopEventDetailsView {...defaultProps} game={practiceGame} />,
        );

        expect(
            screen.queryByTestId("score-panel-compact"),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByTestId("desktop-gameday-panel"),
        ).not.toBeInTheDocument();
    });

    it("does NOT render Lineups or Awards tabs for practice", () => {
        const practiceGame = { ...defaultProps.game, eventType: "practice" };
        renderWithProviders(
            <DesktopEventDetailsView
                {...defaultProps}
                game={practiceGame}
                gameIsPast={true}
            />,
        );

        expect(
            screen.queryByRole("tab", { name: /lineups/i }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("tab", { name: /awards/i }),
        ).not.toBeInTheDocument();
        // Attendance should still be there
        expect(
            screen.getByRole("tab", { name: /attendance/i }),
        ).toBeInTheDocument();
    });
});
