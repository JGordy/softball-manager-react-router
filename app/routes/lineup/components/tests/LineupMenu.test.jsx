import { render, screen, fireEvent } from "@/utils/test-utils";
import * as dateTimeUtils from "@/utils/dateTime";

import LineupMenu from "../LineupMenu";

// Mock dependencies
jest.mock("@/utils/dateTime");

// Mock icons
jest.mock("@tabler/icons-react", () => ({
    IconDots: ({ "data-testid": testId, onClick }) => (
        <div data-testid={testId || "icon-dots"} onClick={onClick} />
    ),
    IconUserPlus: () => <div data-testid="icon-user-plus" />,
    IconUserMinus: () => <div data-testid="icon-user-minus" />,
    IconTrashX: () => <div data-testid="icon-trash" />,
    IconSparkles: () => <div data-testid="icon-sparkles" />,
}));

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

    const openMenu = async () => {
        const trigger = screen.getByTestId("icon-dots");
        fireEvent.click(trigger);
        return screen.findByText("Delete Chart");
    };

    it("renders basic menu items", async () => {
        render(<LineupMenu {...defaultProps} />);

        await openMenu();
        expect(screen.getByText("Add Players")).toBeInTheDocument();
        expect(screen.getByText("Remove Players")).toBeInTheDocument();
        expect(screen.getByText("Delete Chart")).toBeInTheDocument();
        expect(screen.getByText("Generate AI Lineup")).toBeInTheDocument();
    });

    it("hides Add/Remove players if no lineup", async () => {
        const props = {
            ...defaultProps,
            lineupState: [],
        };

        render(<LineupMenu {...props} />);

        await openMenu();
        expect(screen.queryByText("Add Players")).not.toBeInTheDocument();
        expect(screen.queryByText("Remove Players")).not.toBeInTheDocument();
        expect(screen.getByText("Delete Chart")).toBeInTheDocument();
    });

    it("hides AI Generate if game is past", async () => {
        dateTimeUtils.getGameDayStatus.mockReturnValue("past");

        render(<LineupMenu {...defaultProps} />);

        await openMenu();
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

    it("opens AI drawer when Generate AI Lineup clicked", async () => {
        render(<LineupMenu {...defaultProps} />);

        await openMenu();
        fireEvent.click(screen.getByText("Generate AI Lineup"));

        expect(screen.getByTestId("ai-generate-drawer")).toBeInTheDocument();
    });

    it("opens Add Players drawer when clicked", async () => {
        render(<LineupMenu {...defaultProps} />);

        await openMenu();
        fireEvent.click(screen.getByText("Add Players"));

        expect(screen.getByTestId("add-players-drawer")).toBeInTheDocument();
    });

    it("opens Remove Players drawer when clicked", async () => {
        render(<LineupMenu {...defaultProps} />);

        await openMenu();
        fireEvent.click(screen.getByText("Remove Players"));

        expect(screen.getByTestId("remove-players-drawer")).toBeInTheDocument();
    });

    it("opens Delete Lineup drawer when clicked", async () => {
        render(<LineupMenu {...defaultProps} />);

        await openMenu();
        fireEvent.click(screen.getByText("Delete Chart"));

        expect(screen.getByTestId("delete-lineup-drawer")).toBeInTheDocument();
    });
});
