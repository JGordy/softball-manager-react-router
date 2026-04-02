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
});
