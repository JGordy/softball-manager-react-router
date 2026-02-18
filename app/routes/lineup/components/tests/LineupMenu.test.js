import { render, screen, fireEvent } from "@/utils/test-utils";
import * as dateTimeUtils from "@/utils/dateTime";

import LineupMenu from "../LineupMenu";

// Mock dependencies
jest.mock("@/utils/dateTime");

// Mock child components
jest.mock("@/components/MenuContainer", () => ({ sections }) => (
    <div data-testid="menu-container">
        {sections.map((section, idx) => (
            <div key={idx} data-testid="menu-section">
                {section.label}
                {section.items.map((item) => (
                    <button key={item.key} onClick={item.onClick}>
                        {item.content}
                    </button>
                ))}
            </div>
        ))}
    </div>
));

jest.mock(
    "../AILineupDrawer",
    () =>
        ({ opened }) =>
            opened ? <div data-testid="ai-generate-drawer" /> : null,
);
jest.mock(
    "../AddPlayersDrawer",
    () =>
        ({ opened }) =>
            opened ? <div data-testid="add-players-drawer" /> : null,
);
jest.mock(
    "../RemovePlayersDrawer",
    () =>
        ({ opened }) =>
            opened ? <div data-testid="remove-players-drawer" /> : null,
);
jest.mock(
    "../DeleteLineupDrawer",
    () =>
        ({ opened }) =>
            opened ? <div data-testid="delete-lineup-drawer" /> : null,
);

describe("LineupMenu Component", () => {
    const defaultProps = {
        game: { gameDate: "2023-01-01" },
        team: { id: "team1" },
        actionUrl: "/events/evt1/lineup",
        lineupState: [{ $id: "p1" }],
        lineupHandlers: {},
        playersNotInLineup: [],
        players: [{ $id: "p1" }],
        setHasBeenEdited: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        dateTimeUtils.getGameDayStatus.mockReturnValue("upcoming");
    });

    it("renders verify basic menu items", () => {
        render(<LineupMenu {...defaultProps} />);

        expect(screen.getByTestId("menu-container")).toBeInTheDocument();
        expect(screen.getByText("Add Players")).toBeInTheDocument();
        expect(screen.getByText("Remove Players")).toBeInTheDocument();
        expect(screen.getByText("Delete Chart")).toBeInTheDocument();
        expect(screen.getByText("Generate AI Lineup")).toBeInTheDocument();
    });

    it("hides Add/Remove players if no lineup", () => {
        const props = {
            ...defaultProps,
            lineupState: [],
        };

        render(<LineupMenu {...props} />);

        expect(screen.queryByText("Add Players")).not.toBeInTheDocument();
        expect(screen.queryByText("Remove Players")).not.toBeInTheDocument();
        expect(screen.getByText("Delete Chart")).toBeInTheDocument();
    });

    it("hides AI Generate if game is past", () => {
        dateTimeUtils.getGameDayStatus.mockReturnValue("past");

        render(<LineupMenu {...defaultProps} />);

        expect(
            screen.queryByText("Generate AI Lineup"),
        ).not.toBeInTheDocument();
    });

    it("renders drawers closed by default", () => {
        render(<LineupMenu {...defaultProps} />);

        expect(
            screen.queryByTestId("ai-generate-drawer"),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByTestId("add-players-drawer"),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByTestId("remove-players-drawer"),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByTestId("delete-lineup-drawer"),
        ).not.toBeInTheDocument();
    });

    it("opens AI drawer when Generate AI Lineup clicked", () => {
        render(<LineupMenu {...defaultProps} />);

        fireEvent.click(screen.getByText("Generate AI Lineup"));

        expect(screen.getByTestId("ai-generate-drawer")).toBeInTheDocument();
    });

    it("opens Add Players drawer when clicked", () => {
        render(<LineupMenu {...defaultProps} />);

        fireEvent.click(screen.getByText("Add Players"));

        expect(screen.getByTestId("add-players-drawer")).toBeInTheDocument();
    });

    it("opens Remove Players drawer when clicked", () => {
        render(<LineupMenu {...defaultProps} />);

        fireEvent.click(screen.getByText("Remove Players"));

        expect(screen.getByTestId("remove-players-drawer")).toBeInTheDocument();
    });

    it("opens Delete Lineup drawer when clicked", () => {
        render(<LineupMenu {...defaultProps} />);

        fireEvent.click(screen.getByText("Delete Chart"));

        expect(screen.getByTestId("delete-lineup-drawer")).toBeInTheDocument();
    });
});
