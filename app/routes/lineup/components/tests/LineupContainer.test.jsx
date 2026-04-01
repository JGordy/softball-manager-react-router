import { render, screen, fireEvent } from "@/utils/test-utils";
import * as dateTimeUtils from "@/utils/dateTime";
import * as createBattingOrder from "../../utils/createBattingOrder";
import * as createFieldingChart from "../../utils/createFieldingChart";

import LineupContainer from "../LineupContainer";

// Mock dependencies
jest.mock("react-router", () => ({
    useFetcher: jest.fn(),
    Form: ({ children, ...props }) => <form {...props}>{children}</form>,
}));

jest.mock("@/utils/dateTime");
jest.mock("../../utils/createBattingOrder");
jest.mock("../../utils/createFieldingChart");

// Mock child components
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
    };

    beforeEach(() => {
        jest.clearAllMocks();
        require("react-router").useFetcher.mockReturnValue(mockFetcher);
        dateTimeUtils.getGameDayStatus.mockReturnValue("upcoming");
        createBattingOrder.default.mockReturnValue([]);
        createFieldingChart.default.mockReturnValue([]);
    });

    it("renders waiting message when not enough players", () => {
        const props = {
            ...defaultProps,
            players: [], // No players
            lineupState: null, // Ensure lineupState is explicitly null to trigger the "no chart" view
        };

        render(<LineupContainer {...props} />);

        expect(
            screen.getByText(/There aren't enough available players/),
        ).toBeInTheDocument();
    });

    it("renders create charts button when no chart exists", () => {
        // Mock enough players
        const players = Array.from({ length: 8 }, (_, i) => ({
            $id: `p${i}`,
            firstName: `P${i}`,
            availability: "accepted",
        }));

        // When lineupState is null/undefined (not initialized yet)
        const props = {
            ...defaultProps,
            players,
            lineupState: null, // Force null to test the condition
            playerChart: null,
        };

        render(<LineupContainer {...props} />);

        expect(
            screen.getByText("Create Batting and Fielding Charts"),
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

    it("calls handleCreateCharts when create button clicked", () => {
        const players = Array.from({ length: 8 }, (_, i) => ({
            $id: `p${i}`,
            firstName: `P${i}`,
            availability: "accepted",
        }));

        const props = {
            ...defaultProps,
            players,
            lineupState: null,
        };

        render(<LineupContainer {...props} />);

        fireEvent.click(screen.getByText("Create Batting and Fielding Charts"));

        expect(createBattingOrder.default).toHaveBeenCalled();
    });

    it("resets the lineup using the playerChart prop when Reset button clicked", () => {
        const players = Array.from({ length: 8 }, (_, i) => ({
            $id: `p${i}`,
            firstName: `P${i}`,
            availability: "accepted",
        }));

        const originalChart = [{ $id: "p1", positions: [] }];

        const props = {
            ...defaultProps,
            players,
            playerChart: originalChart,
            lineupState: [{ $id: "p1", positions: ["1B"] }], // currently edited state
            hasBeenEdited: true, // Changes made to show Reset button
            lineupHandlers: { setState: jest.fn() },
            setHasBeenEdited: jest.fn(),
        };

        render(<LineupContainer {...props} />);

        // Click the first Reset button
        fireEvent.click(screen.getAllByRole("button", { name: "Reset" })[0]);

        expect(props.lineupHandlers.setState).toHaveBeenCalledWith(
            originalChart,
        );
        expect(props.setHasBeenEdited).toHaveBeenCalledWith(false);
    });
});
