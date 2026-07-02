import { render, screen, fireEvent } from "@/utils/test-utils";
import { UI_KEYS } from "@/constants/scoring";

import ActionPad from "../ActionPad";

describe("ActionPad", () => {
    const mockOnAction = jest.fn();
    const defaultRunners = { first: null, second: null, third: null };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders all base hit buttons", () => {
        render(
            <ActionPad
                onAction={mockOnAction}
                runners={defaultRunners}
                outs={0}
            />,
        );
        expect(screen.getByRole("button", { name: "1B" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "2B" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "3B" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "HR" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "BB" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "ERR" })).toBeInTheDocument();
    });

    it("renders all out buttons", () => {
        render(
            <ActionPad
                onAction={mockOnAction}
                runners={defaultRunners}
                outs={0}
            />,
        );
        expect(screen.getByRole("button", { name: "K" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "GRD" })).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "FLY/POP" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "LINE" }),
        ).toBeInTheDocument();
    });

    it("calls onAction with correct value when button is clicked", () => {
        render(
            <ActionPad
                onAction={mockOnAction}
                runners={defaultRunners}
                outs={0}
            />,
        );
        fireEvent.click(screen.getByRole("button", { name: "1B" }));
        expect(mockOnAction).toHaveBeenCalledWith(UI_KEYS.SINGLE);
    });

    it("disables FC when bases are empty", () => {
        render(
            <ActionPad
                onAction={mockOnAction}
                runners={defaultRunners}
                outs={0}
            />,
        );
        expect(screen.getByRole("button", { name: "FC" })).toBeDisabled();
    });

    it("enables FC when runners are on base", () => {
        render(
            <ActionPad
                onAction={mockOnAction}
                runners={{ first: "runnerId", second: null, third: null }}
                outs={0}
            />,
        );
        expect(screen.getByRole("button", { name: "FC" })).not.toBeDisabled();
    });

    it("disables SF when bases are empty", () => {
        render(
            <ActionPad
                onAction={mockOnAction}
                runners={defaultRunners}
                outs={0}
            />,
        );
        expect(screen.getByRole("button", { name: "SF" })).toBeDisabled();
    });

    it("disables SF when there are 2 outs", () => {
        render(
            <ActionPad
                onAction={mockOnAction}
                runners={{ third: "runnerId" }}
                outs={2}
            />,
        );
        expect(screen.getByRole("button", { name: "SF" })).toBeDisabled();
    });

    it("enables SF when runner on 3rd and less than 2 outs", () => {
        render(
            <ActionPad
                onAction={mockOnAction}
                runners={{ third: "runnerId" }}
                outs={1}
            />,
        );
        expect(screen.getByRole("button", { name: "SF" })).not.toBeDisabled();
    });

    it("renders Single button with tour hook class (.tour-action-1b)", () => {
        render(
            <ActionPad
                onAction={mockOnAction}
                runners={defaultRunners}
                outs={0}
            />,
        );
        const singleBtn = screen.getByRole("button", { name: "1B" });
        expect(singleBtn).toHaveClass("tour-action-1b");
    });

    it("renders all buttons correctly when isDesktop is true", () => {
        render(
            <ActionPad
                onAction={mockOnAction}
                runners={defaultRunners}
                outs={0}
                isDesktop={true}
            />,
        );
        expect(screen.getByRole("button", { name: "1B" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "2B" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "3B" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "HR" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "BB" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "ERR" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "K" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "GRD" })).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "FLY/POP" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "LINE" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "FC" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "SF" })).toBeInTheDocument();
    });
});
