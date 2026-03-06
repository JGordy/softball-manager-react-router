import { render, screen, fireEvent } from "@/utils/test-utils";
import RunnerControl from "../RunnerControl";

describe("RunnerControl", () => {
    it("renders label correctly", () => {
        render(
            <MantineProvider>
                <RunnerControl
                    label="Runner on 1st"
                    value="second"
                    onChange={() => {}}
                />
            </MantineProvider>,
        );
        expect(screen.getByText("Runner on 1st:")).toBeInTheDocument();
    });

    it("renders Stay and other default options", () => {
        render(
            <MantineProvider>
                <RunnerControl
                    label="Runner on 1st"
                    value="second"
                    onChange={() => {}}
                />
            </MantineProvider>,
        );
        expect(screen.getByText("Stay")).toBeInTheDocument();
        expect(screen.getByText("Score")).toBeInTheDocument();
        expect(screen.getByText("OUT")).toBeInTheDocument();
    });

    it("can hide Stay option", () => {
        render(
            <MantineProvider>
                <RunnerControl
                    label="Batter"
                    value="first"
                    hideStay={true}
                    onChange={() => {}}
                />
            </MantineProvider>,
        );
        expect(screen.queryByText("Stay")).not.toBeInTheDocument();
        expect(screen.getByText("Score")).toBeInTheDocument();
    });

    it("renders intermediate options", () => {
        const intermediate = [{ label: "2nd", value: "second" }];
        render(
            <MantineProvider>
                <RunnerControl
                    label="Batter"
                    value="first"
                    intermediateOptions={intermediate}
                    onChange={() => {}}
                />
            </MantineProvider>,
        );
        expect(screen.getByText("2nd")).toBeInTheDocument();
    });

    it("calls onChange when an option is clicked", () => {
        const onChangeMock = jest.fn();
        render(
            <MantineProvider>
                <RunnerControl
                    label="Runner"
                    value="stay"
                    onChange={onChangeMock}
                />
            </MantineProvider>,
        );

        // Mantine SegmentedControl uses inputs under the hood
        const outInput = screen
            .getAllByRole("radio")
            .find((r) => r.value === "out");
        fireEvent.click(outInput);

        expect(onChangeMock).toHaveBeenCalledWith("out");
    });

    it("returns null if value is null or undefined", () => {
        render(
            <MantineProvider>
                <div data-testid="wrapper">
                    <RunnerControl
                        label="Runner"
                        value={null}
                        onChange={() => {}}
                    />
                </div>
            </MantineProvider>,
        );
        expect(screen.getByTestId("wrapper")).toBeEmptyDOMElement();
    });
});
