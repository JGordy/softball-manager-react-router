import { render, screen, fireEvent } from "@/utils/test-utils";
import * as gamedayUtils from "../../utils/gamedayUtils";

import LastPlayCard from "../LastPlayCard";

// Mock gamedayUtils
jest.mock("../../utils/gamedayUtils");

describe("LastPlayCard", () => {
    const mockLog = {
        $id: "log1",
        description: "John singles to left",
        baseState: "{}",
    };
    const mockPlayerChart = [];
    const mockOnUndo = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        gamedayUtils.getRunnerMovement.mockReturnValue(["Runner to 2nd"]);
    });

    it("renders last play description", () => {
        render(
            <LastPlayCard
                lastLog={mockLog}
                onUndo={mockOnUndo}
                isSubmitting={false}
                playerChart={mockPlayerChart}
            />,
        );
        expect(screen.getByText("LAST PLAY")).toBeInTheDocument();
        expect(screen.getByText("John singles to left")).toBeInTheDocument();
    });

    it("renders runner movements if any", () => {
        render(
            <LastPlayCard
                lastLog={mockLog}
                onUndo={mockOnUndo}
                isSubmitting={false}
                playerChart={mockPlayerChart}
            />,
        );
        expect(screen.getByText("Runner to 2nd")).toBeInTheDocument();
    });

    it("renders undo button if onUndo provided", () => {
        render(
            <LastPlayCard
                lastLog={mockLog}
                onUndo={mockOnUndo}
                isSubmitting={false}
                playerChart={mockPlayerChart}
            />,
        );
        expect(
            screen.getByRole("button", { name: "Undo" }),
        ).toBeInTheDocument();
    });

    it("calls onUndo when button clicked", () => {
        render(
            <LastPlayCard
                lastLog={mockLog}
                onUndo={mockOnUndo}
                isSubmitting={false}
                playerChart={mockPlayerChart}
            />,
        );
        fireEvent.click(screen.getByRole("button", { name: "Undo" }));
        expect(mockOnUndo).toHaveBeenCalled();
    });

    it("shows loading state on undo button", () => {
        render(
            <LastPlayCard
                lastLog={mockLog}
                onUndo={mockOnUndo}
                isSubmitting={true}
                playerChart={mockPlayerChart}
            />,
        );
        expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    });
});
