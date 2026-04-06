import { render, screen, fireEvent } from "@/utils/test-utils";

import CreateLineupDrawer from "../CreateLineupDrawer";

jest.mock("react-router", () => ({
    useOutletContext: jest.fn(() => ({ isDesktop: false })),
}));

jest.mock("@/components/DrawerContainer", () => {
    return function MockDrawerContainer({ children, opened, title }) {
        if (!opened) return null;
        return (
            <div role="dialog" aria-label={title}>
                <h2>{title}</h2>
                {children}
            </div>
        );
    };
});

const defaultProps = {
    opened: true,
    onClose: jest.fn(),
    availablePlayers: [],
    onStartFromScratch: jest.fn(),
    onCreateWithAvailable: jest.fn(),
    onOpenAiDrawer: jest.fn(),
};

function renderDrawer(props = {}) {
    return render(<CreateLineupDrawer {...defaultProps} {...props} />);
}

describe("CreateLineupDrawer", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("rendering", () => {
        it("renders the drawer title", () => {
            renderDrawer();
            expect(screen.getByText("Create Lineup")).toBeInTheDocument();
        });

        it("does not render when closed", () => {
            renderDrawer({ opened: false });
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });

        it("renders all three option cards", () => {
            renderDrawer();
            expect(
                screen.getByRole("button", { name: "Start from Scratch" }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("button", {
                    name: "Create with Available Players",
                }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole("button", { name: "Generate AI Lineup" }),
            ).toBeInTheDocument();
        });
    });

    describe("Start from Scratch", () => {
        it("is always enabled", () => {
            renderDrawer({ availablePlayers: [] });
            const buttons = screen.getAllByRole("button", {
                name: "Start from Scratch",
            });
            buttons.forEach((btn) => expect(btn).not.toBeDisabled());
        });

        it("calls onStartFromScratch when clicked", () => {
            renderDrawer();
            fireEvent.click(
                screen.getByRole("button", { name: "Start from Scratch" }),
            );
            expect(defaultProps.onStartFromScratch).toHaveBeenCalledTimes(1);
        });
    });

    describe("Create with Available Players", () => {
        it("is disabled when there are no accepted players", () => {
            renderDrawer({ availablePlayers: [] });
            expect(
                screen.getByRole("button", {
                    name: "Create with Available Players",
                }),
            ).toBeDisabled();
        });

        it("shows a message when no players have accepted", () => {
            renderDrawer({ availablePlayers: [] });
            expect(
                screen.getByText(/No players have accepted yet/i),
            ).toBeInTheDocument();
        });

        it("is enabled when there is at least 1 accepted player", () => {
            renderDrawer({
                availablePlayers: [{ $id: "p1", availability: "accepted" }],
            });
            expect(
                screen.getByRole("button", {
                    name: "Create with Available Players",
                }),
            ).not.toBeDisabled();
        });

        it("shows the player count in the description", () => {
            renderDrawer({
                availablePlayers: [
                    { $id: "p1", availability: "accepted" },
                    { $id: "p2", availability: "accepted" },
                ],
            });
            expect(
                screen.getByText(/from your 2 available players/i),
            ).toBeInTheDocument();
        });

        it("uses singular 'player' for exactly 1 player", () => {
            renderDrawer({
                availablePlayers: [{ $id: "p1", availability: "accepted" }],
            });
            expect(
                screen.getByText(/from your 1 available player\./i),
            ).toBeInTheDocument();
        });

        it("calls onCreateWithAvailable when clicked", () => {
            renderDrawer({
                availablePlayers: [{ $id: "p1", availability: "accepted" }],
            });
            fireEvent.click(
                screen.getByRole("button", {
                    name: "Create with Available Players",
                }),
            );
            expect(defaultProps.onCreateWithAvailable).toHaveBeenCalledTimes(1);
        });
    });

    describe("Generate AI Lineup", () => {
        it("shows the player count requirement when fewer than 9 players", () => {
            renderDrawer({
                availablePlayers: Array(4).fill({
                    $id: "p",
                    availability: "accepted",
                }),
            });
            expect(
                screen.getByText(
                    /Requires 9 or more available players \(4 available\)/i,
                ),
            ).toBeInTheDocument();
        });

        it("is enabled and calls onOpenAiDrawer regardless of player count", () => {
            renderDrawer({ availablePlayers: [] });
            const btn = screen.getByRole("button", {
                name: "Generate AI Lineup",
            });
            expect(btn).not.toBeDisabled();
            fireEvent.click(btn);
            expect(defaultProps.onOpenAiDrawer).toHaveBeenCalledTimes(1);
        });

        it("shows the optimized description when 9 or more players are available", () => {
            renderDrawer({
                availablePlayers: Array(9)
                    .fill(null)
                    .map((_, i) => ({
                        $id: `p${i}`,
                        availability: "accepted",
                    })),
            });
            expect(
                screen.getByText(/Use AI to generate an optimized lineup/i),
            ).toBeInTheDocument();
        });

        it("calls onOpenAiDrawer when clicked with enough players", () => {
            renderDrawer({
                availablePlayers: Array(9)
                    .fill(null)
                    .map((_, i) => ({
                        $id: `p${i}`,
                        availability: "accepted",
                    })),
            });
            fireEvent.click(
                screen.getByRole("button", { name: "Generate AI Lineup" }),
            );
            expect(defaultProps.onOpenAiDrawer).toHaveBeenCalledTimes(1);
        });
    });
});
