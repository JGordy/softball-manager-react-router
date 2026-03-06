import { render, screen } from "@/utils/test-utils";
import RunnerPanel from "../RunnerPanel";

jest.mock("../RunnerControl", () => {
    return function MockRunnerControl({ label, value }) {
        return (
            <div data-testid="runner-control">
                {label}: {value}
            </div>
        );
    };
});

describe("RunnerPanel", () => {
    const defaultProps = {
        actionType: "1B",
        runners: { first: "player1" },
        outs: 1,
        runnerResults: { first: "second", batter: "first" },
        setRunnerResults: jest.fn(),
    };

    it("returns null for HR", () => {
        render(
            <div data-testid="wrapper">
                <RunnerPanel {...defaultProps} actionType="HR" />
            </div>,
        );
        expect(screen.getByTestId("wrapper")).toBeEmptyDOMElement();
    });

    it("returns inning over text if outs >= 3", () => {
        render(<RunnerPanel {...defaultProps} outs={3} />);
        expect(
            screen.getByText("Inning over. No runner advancement."),
        ).toBeInTheDocument();
    });

    it("calculates new outs from the play type (e.g. Fly Out)", () => {
        // If 2 outs currently, and the action is a Fly Out, that's the 3rd out
        render(<RunnerPanel {...defaultProps} actionType="Fly Out" outs={2} />);
        expect(
            screen.getByText("Inning over. No runner advancement."),
        ).toBeInTheDocument();
    });

    it("renders RunnerControls based on visible configs", () => {
        render(<RunnerPanel {...defaultProps} />);

        const controls = screen.getAllByTestId("runner-control");
        expect(controls.length).toBe(2); // one for Runner on 1st, one for Batter
        expect(controls[0]).toHaveTextContent("Runner on 1st: second");
        expect(controls[1]).toHaveTextContent("Batter: first");
    });
});
