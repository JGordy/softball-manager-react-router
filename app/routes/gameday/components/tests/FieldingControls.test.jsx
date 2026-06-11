import { render, screen, fireEvent } from "@/utils/test-utils";
import FieldingControls from "../FieldingControls";

describe("FieldingControls", () => {
    const mockOnOut = jest.fn();
    const mockOnRun = jest.fn();
    const mockOnSkip = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

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
        expect(
            screen.getByRole("button", { name: "Increase runs" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Decrease runs" }),
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

    it("calls onRun handler when RUN button is clicked with default 1 run", () => {
        render(
            <FieldingControls
                onOut={mockOnOut}
                onRun={mockOnRun}
                onSkip={mockOnSkip}
            />,
        );
        fireEvent.click(screen.getByRole("button", { name: "RUN" }));
        expect(mockOnRun).toHaveBeenCalledWith(1);
    });

    it("increments runs when Increase runs button is clicked", () => {
        render(
            <FieldingControls
                onOut={mockOnOut}
                onRun={mockOnRun}
                onSkip={mockOnSkip}
            />,
        );
        const increaseButton = screen.getByRole("button", {
            name: "Increase runs",
        });

        fireEvent.click(increaseButton);
        expect(
            screen.getByRole("button", { name: "2 RUNS" }),
        ).toBeInTheDocument();

        fireEvent.click(increaseButton);
        expect(
            screen.getByRole("button", { name: "3 RUNS" }),
        ).toBeInTheDocument();
    });

    it("decrements runs when Decrease runs button is clicked but not below 1", () => {
        render(
            <FieldingControls
                onOut={mockOnOut}
                onRun={mockOnRun}
                onSkip={mockOnSkip}
            />,
        );
        const increaseButton = screen.getByRole("button", {
            name: "Increase runs",
        });
        const decreaseButton = screen.getByRole("button", {
            name: "Decrease runs",
        });

        // Starts disabled at 1
        expect(decreaseButton).toBeDisabled();

        // Increment to 3
        fireEvent.click(increaseButton);
        fireEvent.click(increaseButton);
        expect(decreaseButton).not.toBeDisabled();
        expect(
            screen.getByRole("button", { name: "3 RUNS" }),
        ).toBeInTheDocument();

        // Decrement to 2
        fireEvent.click(decreaseButton);
        expect(
            screen.getByRole("button", { name: "2 RUNS" }),
        ).toBeInTheDocument();

        // Decrement to 1
        fireEvent.click(decreaseButton);
        expect(screen.getByRole("button", { name: "RUN" })).toBeInTheDocument();
        expect(decreaseButton).toBeDisabled();
    });

    it("calls onRun with correct runs count and resets to 1", () => {
        render(
            <FieldingControls
                onOut={mockOnOut}
                onRun={mockOnRun}
                onSkip={mockOnSkip}
            />,
        );
        const increaseButton = screen.getByRole("button", {
            name: "Increase runs",
        });

        fireEvent.click(increaseButton);
        fireEvent.click(increaseButton); // Now 3 runs

        const scoreButton = screen.getByRole("button", { name: "3 RUNS" });
        fireEvent.click(scoreButton);

        expect(mockOnRun).toHaveBeenCalledWith(3);

        // Counter should reset to 1 (rendering "RUN")
        expect(screen.getByRole("button", { name: "RUN" })).toBeInTheDocument();
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

    it("renders horizontal layout when isDesktop is true", () => {
        render(
            <FieldingControls
                onOut={mockOnOut}
                onRun={mockOnRun}
                onSkip={mockOnSkip}
                isDesktop={true}
            />,
        );
        expect(screen.getByText("FIELDING CONTROLS")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "OUT" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "RUN" })).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Skip to Batting" }),
        ).toBeInTheDocument();
    });
});
