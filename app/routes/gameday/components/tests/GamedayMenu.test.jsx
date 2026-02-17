import { render, screen, fireEvent } from "@/utils/test-utils";
import * as modalHooks from "@/hooks/useModal";

import GamedayMenu from "../GamedayMenu";

// Mock fetcher
const mockSubmit = jest.fn();
jest.mock("react-router", () => ({
    useFetcher: () => ({ submit: mockSubmit }),
}));

jest.mock("@/hooks/useModal");
jest.mock("@/components/MenuContainer", () => ({ sections }) => (
    <div>
        {sections.map((section) => (
            <div key={section.label}>
                <div>{section.label}</div>
                {section.items.map((item) => (
                    <button key={item.key} onClick={item.onClick}>
                        {item.content}
                    </button>
                ))}
            </div>
        ))}
    </div>
));

describe("GamedayMenu", () => {
    const mockOpenModal = jest.fn();
    const mockCloseAllModals = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        modalHooks.default.mockReturnValue({
            openModal: mockOpenModal,
            closeAllModals: mockCloseAllModals,
        });
    });

    it("renders end game button when game is active", () => {
        render(<GamedayMenu gameFinal={false} score={5} opponentScore={3} />);
        expect(screen.getByText("End Game")).toBeInTheDocument();
    });

    it("renders resume game button when game is final", () => {
        render(<GamedayMenu gameFinal={true} score={5} opponentScore={3} />);
        expect(screen.getByText("Resume Game")).toBeInTheDocument();
    });

    it("opens modal on end game click", () => {
        render(<GamedayMenu gameFinal={false} score={5} opponentScore={3} />);
        fireEvent.click(screen.getByText("End Game"));
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({ title: "End Game" }),
        );
    });

    it("opens modal on resume game click", () => {
        render(<GamedayMenu gameFinal={true} score={5} opponentScore={3} />);
        fireEvent.click(screen.getByText("Resume Game"));
        expect(mockOpenModal).toHaveBeenCalledWith(
            expect.objectContaining({ title: "Resume Game" }),
        );
    });
});
