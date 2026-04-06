import { render, screen, fireEvent } from "@/utils/test-utils";
import * as dateTimeUtils from "@/utils/dateTime";
import { trackEvent } from "@/utils/analytics";
import * as createBattingOrder from "../../utils/createBattingOrder";
import * as createFieldingChart from "../../utils/createFieldingChart";

import LineupContainer from "../LineupContainer";

// Mock dependencies
jest.mock("react-router", () => ({
    useFetcher: jest.fn(),
    useOutletContext: jest.fn(() => ({ isDesktop: false })),
    Form: ({ children, ...props }) => <form {...props}>{children}</form>,
}));

jest.mock(
    "../CreateLineupDrawer",
    () =>
        function MockCreateLineupDrawer({
            opened,
            onStartFromScratch,
            onCreateWithAvailable,
            onOpenAiDrawer,
        }) {
            if (!opened) return null;
            return (
                <div data-testid="create-lineup-drawer">
                    <button onClick={onStartFromScratch}>
                        Start from Scratch
                    </button>
                    <button onClick={onCreateWithAvailable}>
                        Create with Available
                    </button>
                    <button onClick={onOpenAiDrawer}>Generate AI Lineup</button>
                </div>
            );
        },
);

jest.mock("@/utils/dateTime");
jest.mock("../../utils/createBattingOrder");
jest.mock("../../utils/createFieldingChart");
jest.mock("@/utils/analytics", () => ({ trackEvent: jest.fn() }));

// Mock child components
// eslint-disable-next-line react/display-name
jest.mock("../EditablePlayerChart", () => ({ playerChart }) => (
    <div data-testid="editable-player-chart">
        {playerChart?.length || 0} players
    </div>
));

describe("LineupContainer Component", () => {
    const mockFetcher = {
        submit: jest.fn(),
        state: "idle",
        data: null,
        Form: ({ children, ...props }) => <form {...props}>{children}</form>,
    };

    // Default props
    const defaultProps = {
        game: { $id: "game1", team: { idealLineup: [] } },
        managerView: true,
        playerChart: [],
        players: [
            {
                $id: "p1",
                firstName: "Player",
                lastName: "One",
                availability: "accepted",
            },
            {
                $id: "p2",
                firstName: "Player",
                lastName: "Two",
                availability: "accepted",
            },
        ],
        lineupState: [],
        lineupHandlers: { setState: jest.fn() },
        hasBeenEdited: false,
        setHasBeenEdited: jest.fn(),
        validationResults: {},
        teams: [{ id: "team1", idealLineup: [] }],
        onOpenAiDrawer: jest.fn(),
        onOpenAddPlayers: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        require("react-router").useFetcher.mockReturnValue(mockFetcher);
        dateTimeUtils.getGameDayStatus.mockReturnValue("upcoming");
        createBattingOrder.default.mockReturnValue([]);
        createFieldingChart.default.mockReturnValue([]);
    });

    it("renders Create Lineup button for manager when no lineup exists", () => {
        const props = {
            ...defaultProps,
            players: [],
            lineupState: null,
        };

        render(<LineupContainer {...props} />);

        expect(
            screen.getByRole("button", { name: /Create Lineup/i }),
        ).toBeInTheDocument();
    });

    it("renders Create Lineup button when no chart exists", () => {
        const players = Array.from({ length: 8 }, (_, i) => ({
            $id: `p${i}`,
            firstName: `P${i}`,
            availability: "accepted",
        }));

        const props = {
            ...defaultProps,
            players,
            lineupState: null,
            playerChart: null,
        };

        render(<LineupContainer {...props} />);

        expect(
            screen.getByRole("button", { name: /Create Lineup/i }),
        ).toBeInTheDocument();
    });

    it("renders buttons when changes made", () => {
        // Mock enough players
        const players = Array.from({ length: 8 }, (_, i) => ({
            $id: `p${i}`,
            firstName: `P${i}`,
            availability: "accepted",
        }));

        const props = {
            ...defaultProps,
            players,
            lineupState: [{ $id: "p1", positions: [] }], // Has lineup
            hasBeenEdited: true, // Changes made
        };

        render(<LineupContainer {...props} />);

        const saveButtons = screen.getAllByRole("button", { name: "Save" });
        const resetButtons = screen.getAllByRole("button", { name: "Reset" });
        const savePublishButtons = screen.getAllByRole("button", {
            name: "Save & Publish",
        });

        expect(saveButtons).toHaveLength(2);
        expect(resetButtons).toHaveLength(2);
        expect(savePublishButtons).toHaveLength(2);
    });

    it("opens CreateLineupDrawer when Create Lineup button is clicked", () => {
        const props = {
            ...defaultProps,
            lineupState: null,
        };

        render(<LineupContainer {...props} />);

        expect(
            screen.queryByTestId("create-lineup-drawer"),
        ).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Create Lineup/i }));

        expect(screen.getByTestId("create-lineup-drawer")).toBeInTheDocument();
    });

    it("tracks lineup_open_create_drawer when Create Lineup button is clicked", () => {
        render(<LineupContainer {...defaultProps} lineupState={null} />);

        fireEvent.click(screen.getByRole("button", { name: /Create Lineup/i }));

        expect(trackEvent).toHaveBeenCalledWith("lineup_open_create_drawer", {
            gameId: "game1",
        });
    });

    it("tracks lineup_start_from_scratch when Start from Scratch is chosen", () => {
        render(<LineupContainer {...defaultProps} lineupState={null} />);
        fireEvent.click(screen.getByRole("button", { name: /Create Lineup/i }));
        fireEvent.click(
            screen.getByRole("button", { name: "Start from Scratch" }),
        );

        expect(trackEvent).toHaveBeenCalledWith("lineup_start_from_scratch", {
            gameId: "game1",
        });
    });

    it("tracks lineup_create_with_available when Create with Available is chosen", () => {
        render(<LineupContainer {...defaultProps} lineupState={null} />);
        fireEvent.click(screen.getByRole("button", { name: /Create Lineup/i }));
        fireEvent.click(
            screen.getByRole("button", { name: "Create with Available" }),
        );

        expect(trackEvent).toHaveBeenCalledWith(
            "lineup_create_with_available",
            {
                gameId: "game1",
            },
        );
    });

    it("tracks lineup_open_ai_drawer when Generate AI Lineup is chosen", () => {
        render(<LineupContainer {...defaultProps} lineupState={null} />);
        fireEvent.click(screen.getByRole("button", { name: /Create Lineup/i }));
        fireEvent.click(
            screen.getByRole("button", { name: "Generate AI Lineup" }),
        );

        expect(trackEvent).toHaveBeenCalledWith("lineup_open_ai_drawer", {
            gameId: "game1",
        });
    });
});
