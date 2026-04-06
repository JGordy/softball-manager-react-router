import { render, screen, fireEvent } from "@/utils/test-utils";
import * as dateTimeUtils from "@/utils/dateTime";
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
        function MockCreateLineupDrawer({ opened }) {
            return opened ? <div data-testid="create-lineup-drawer" /> : null;
        },
);

jest.mock("@/utils/dateTime");
jest.mock("../../utils/createBattingOrder");
jest.mock("../../utils/createFieldingChart");

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
});
