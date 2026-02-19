import { render, screen, fireEvent } from "@/utils/test-utils";
import * as modalHooks from "@/hooks/useModal";
import { useFetcher } from "react-router";

import GamedayMenu from "../GamedayMenu";

// Mock react-router
jest.mock("react-router", () => ({
    ...jest.requireActual("react-router"),
    useFetcher: jest.fn(),
}));

jest.mock("@/hooks/useModal");

// Mock icons
jest.mock("@tabler/icons-react", () => ({
    IconDots: ({ "data-testid": testId, onClick }) => (
        <div data-testid={testId || "icon-dots"} onClick={onClick} />
    ),
    IconFlag: () => <div data-testid="icon-flag" />,
    IconPlayerPlay: () => <div data-testid="icon-play" />,
}));

describe("GamedayMenu", () => {
    const mockSubmit = jest.fn();
    const mockOpenModal = jest.fn();
    const mockCloseAllModals = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useFetcher.mockReturnValue({ submit: mockSubmit });
        modalHooks.default.mockReturnValue({
            openModal: mockOpenModal,
            closeAllModals: mockCloseAllModals,
        });
    });

    const openMenu = async () => {
        const trigger = screen.getByTestId("icon-dots");
        fireEvent.click(trigger);
        return screen.findByText(/End Game|Resume Game/);
    };

    it("renders the trigger", async () => {
        render(<GamedayMenu gameFinal={false} score={5} opponentScore={3} />);
        expect(screen.getByTestId("icon-dots")).toBeInTheDocument();
    });

    it("renders end game button when game is active", async () => {
        render(<GamedayMenu gameFinal={false} score={5} opponentScore={3} />);
        const trigger = screen.getByTestId("icon-dots");
        fireEvent.click(trigger);
        const item = await screen.findByText("End Game");
        expect(item).toBeInTheDocument();
    });

    it("renders resume game button when game is final", async () => {
        render(<GamedayMenu gameFinal={true} score={5} opponentScore={3} />);
        await openMenu();
        expect(screen.getByText("Resume Game")).toBeInTheDocument();
    });

    it("opens modal on end game click", async () => {
        render(<GamedayMenu gameFinal={false} score={5} opponentScore={3} />);
        await openMenu();
        fireEvent.click(screen.getByText("End Game"));
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({ title: "End Game" }),
        );
    });

    it("opens modal on resume game click", async () => {
        render(<GamedayMenu gameFinal={true} score={5} opponentScore={3} />);
        await openMenu();
        fireEvent.click(screen.getByText("Resume Game"));
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({ title: "Resume Game" }),
        );
    });
});
