import { render, screen, fireEvent } from "@/utils/test-utils";
import FieldingControls from "../FieldingControls";

describe("FieldingControls", () => {
    const mockOnOut = jest.fn();
    const mockOnRun = jest.fn();
    const mockOnSkip = jest.fn();

    it("renders all buttons", () => {
        render(
            <FieldingControls
                onOut={mockOnOut}
                onRun={mockOnRun}
                onSkip={mockOnSkip}
            />,
        );
        expect(screen.getByText("FIELDING CONTROLS")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "OUT" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "RUN" })).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Skip to Batting" }),
        ).toBeInTheDocument();
    });

    it("calls onOut handler when OUT button is clicked", () => {
        render(
            <FieldingControls
                onOut={mockOnOut}
                onRun={mockOnRun}
                onSkip={mockOnSkip}
            />,
        );
        fireEvent.click(screen.getByRole("button", { name: "OUT" }));
        expect(mockOnOut).toHaveBeenCalled();
    });

    it("calls onRun handler when RUN button is clicked", () => {
        render(
            <FieldingControls
                onOut={mockOnOut}
                onRun={mockOnRun}
                onSkip={mockOnSkip}
            />,
        );
        fireEvent.click(screen.getByRole("button", { name: "RUN" }));
        expect(mockOnRun).toHaveBeenCalled();
    });

    it("calls onSkip handler when Skip button is clicked", () => {
        render(
            <FieldingControls
                onOut={mockOnOut}
                onRun={mockOnRun}
                onSkip={mockOnSkip}
            />,
        );
        fireEvent.click(
            screen.getByRole("button", { name: "Skip to Batting" }),
        );
        expect(mockOnSkip).toHaveBeenCalled();
    });
});
