import { render, screen } from "@/utils/test-utils";
import { FunctionHealth } from "../FunctionHealth";

describe("FunctionHealth", () => {
    const mockFunctions = [
        {
            id: "f1",
            name: "game_award_tally",
            enabled: true,
            updatedAt: "2026-07-28T00:00:00.000Z",
            lastRun: "2026-08-05T07:00:00.000Z",
        },
    ];

    it("renders function name, enabled indicator, and last run timestamp", () => {
        render(<FunctionHealth functions={mockFunctions} />);
        expect(screen.getByText("Cloud Functions")).toBeInTheDocument();
        expect(screen.getByText("Game Award Tally")).toBeInTheDocument();
        expect(screen.getByText("Enabled")).toBeInTheDocument();
        expect(screen.getByLabelText("Enabled")).toBeInTheDocument();
        expect(screen.getByText("Last Run")).toBeInTheDocument();
    });

    it("returns null when functions list is empty", () => {
        const { container } = render(<FunctionHealth functions={[]} />);
        expect(container.querySelector("table")).not.toBeInTheDocument();
    });
});
