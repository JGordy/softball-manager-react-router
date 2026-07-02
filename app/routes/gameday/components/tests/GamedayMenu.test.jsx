import { render, screen, fireEvent } from "@/utils/test-utils";
import * as modalHooks from "@/hooks/useModal";

import GamedayMenu from "../GamedayMenu";

// Mock react-router
jest.mock("react-router", () => ({
    useFetcher: jest.fn(),
    useParams: jest.fn(),
    Link: ({ children, to, ...props }) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
    MemoryRouter: ({ children }) => <div>{children}</div>,
}));

// Mock components
jest.mock("@/components/MenuContainer", () => ({ sections }) => (
    <div data-testid="menu-container">
        {sections.map((section) => (
            <div key={section.label} data-testid={`section-${section.label}`}>
                {section.items.map((item) => (
                    <button
                        key={item.key}
                        onClick={item.onClick}
                        {...(item.component === "a" ||
                        typeof item.component === "function"
                            ? { "data-component": "link", to: item.to }
                            : {})}
                    >
                        {item.content}
                    </button>
                ))}
            </div>
        ))}
    </div>
));

// Mock hooks
jest.mock("@/hooks/useModal");

// Mock icons (not strictly needed now but keeps it clean)
jest.mock("@tabler/icons-react", () => ({
    IconFlag: () => null,
    IconPlayerPlay: () => null,
    IconArrowsExchange: () => null,
    IconClipboardList: () => null,
    IconChartBar: () => null,
    IconRefresh: () => null,
}));

describe("GamedayMenu", () => {
    const mockSubmit = jest.fn();
    const mockOpenModal = jest.fn();
    const mockCloseAllModals = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        const { useFetcher, useParams } = require("react-router");
        useFetcher.mockReturnValue({ submit: mockSubmit });
        useParams.mockReturnValue({ eventId: "evt1" });

        modalHooks.default.mockReturnValue({
            openModal: mockOpenModal,
            closeAllModals: mockCloseAllModals,
        });
    });

    const openMenu = async () => {
        // No need to click a trigger with mocked MenuContainer
        return screen.queryByTestId("menu-container");
    };

    const renderMenu = (props = {}) =>
        render(
            <GamedayMenu
                gameFinal={false}
                score={5}
                opponentScore={3}
                game={{ teamId: "t1" }}
                inning={1}
                halfInning="top"
                {...props}
            />,
        );

    it("renders the menu container", async () => {
        renderMenu();
        expect(screen.getByTestId("menu-container")).toBeInTheDocument();
    });

    it("renders end game button when game is active", async () => {
        renderMenu();
        expect(screen.getByText("End Game")).toBeInTheDocument();
    });

    it("renders resume game button when game is final", async () => {
        renderMenu({ gameFinal: true });
        await openMenu();
        expect(screen.getByText("Resume Game")).toBeInTheDocument();
    });

    it("renders sub batter button when 'onSubBatter' is provided and game is active", async () => {
        const mockSub = jest.fn();
        renderMenu({ onSubBatter: mockSub });
        await openMenu();

        const subButton = screen.getByText("Sub Current Batter");
        expect(subButton).toBeInTheDocument();
        fireEvent.click(subButton);
        expect(mockSub).toHaveBeenCalled();
    });

    it("opens modal on end game click", async () => {
        renderMenu();
        await openMenu();
        fireEvent.click(screen.getByText("End Game"));
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({ title: "End Game" }),
        );
    });

    it("opens modal on resume game click", async () => {
        renderMenu({ gameFinal: true });
        await openMenu();
        fireEvent.click(screen.getByText("Resume Game"));
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({ title: "Resume Game" }),
        );
    });

    it("renders edit lineup link", async () => {
        renderMenu();
        const link = screen.getByText("Edit Lineup");
        expect(link).toBeInTheDocument();
        expect(link.closest("button")).toHaveAttribute(
            "to",
            "/events/evt1/lineup",
        );
    });

    it("renders opponent controls when game is active and it is opponent batting", async () => {
        const mockToggle = jest.fn();

        renderMenu({
            gameFinal: false,
            isOurBatting: false,
            opponentScoringMode: "Basic",
            onToggleOpponentScoringMode: mockToggle,
        });

        const toggleButton = screen.getByText("Detailed Scoring");
        expect(toggleButton).toBeInTheDocument();
        fireEvent.click(toggleButton);
        expect(mockToggle).toHaveBeenCalled();
    });

    it("renders detailed opponent controls like Set Active Batter and Wrap when detailed scoring mode is active", async () => {
        const mockOpenSelectBatter = jest.fn();

        renderMenu({
            gameFinal: false,
            isOurBatting: false,
            opponentScoringMode: "Detailed",
            onOpenSelectBatterDrawer: mockOpenSelectBatter,
        });

        const setBatterButton = screen.getByText("Set Active Batter");
        expect(setBatterButton).toBeInTheDocument();
        fireEvent.click(setBatterButton);
        expect(mockOpenSelectBatter).toHaveBeenCalled();

        expect(screen.getByText("Top of Lineup (Wrap)")).toBeInTheDocument();
    });

    it("locks and wraps the opponent lineup with padding if necessary", async () => {
        const mockOpponentChart = [
            { $id: "OPP_BAT_1", firstName: "Opponent", lastName: "One" },
        ];

        renderMenu({
            gameFinal: false,
            isOurBatting: false,
            opponentScoringMode: "Detailed",
            opponentChart: mockOpponentChart,
            opponentOrderIndex: 2, // Batter 3, which is larger than current chart length (1)
        });

        // Trigger wrap lineup click to open modal
        const wrapButton = screen.getByText("Top of Lineup (Wrap)");
        fireEvent.click(wrapButton);

        // Expect the modal to be opened
        expect(mockOpenModal).toHaveBeenCalled();

        // Retrieve modal children callback to render and test it
        const modalCall = mockOpenModal.mock.calls[0][0];
        const { render: renderInModal } = require("@/utils/test-utils");
        const modalScreen = renderInModal(modalCall.children);

        // Click Confirm
        const confirmButton = modalScreen.getByText("Confirm");
        fireEvent.click(confirmButton);

        expect(mockSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                _action: "lock-opponent-lineup",
                opponentLineupLocked: true,
            }),
            expect.anything(),
        );

        // Parse and check the sent opponentLineup has 3 batters (OPP_BAT_1, OPP_BAT_2, OPP_BAT_3)
        const submittedData = mockSubmit.mock.calls[0][0];
        const submittedLineup = JSON.parse(submittedData.opponentLineup);
        expect(submittedLineup).toHaveLength(2);
        expect(submittedLineup[0].$id).toBe("OPP_BAT_1");
        expect(submittedLineup[1].$id).toBe("OPP_BAT_2");
    });
});
