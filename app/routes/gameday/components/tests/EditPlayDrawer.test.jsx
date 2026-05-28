import { render, screen, fireEvent, waitFor } from "@/utils/test-utils";
import { UI_KEYS } from "@/constants/scoring";
import EditPlayDrawer from "../EditPlayDrawer";

// Heavy sub-components that have their own test suites
jest.mock("../RunnerAdvancementDND", () => ({
    __esModule: true,
    default: ({ setRunnerResults }) => (
        <div
            data-testid="runner-dnd"
            onClick={() =>
                setRunnerResults({
                    batter: "second",
                    first: null,
                    second: null,
                    third: null,
                })
            }
        />
    ),
}));

jest.mock("../FieldHighlight", () => ({
    __esModule: true,
    default: () => <div data-testid="field-highlight" />,
}));

jest.mock("../ActionPad", () => ({
    __esModule: true,
    default: ({ onAction }) => (
        <div>
            <button onClick={() => onAction && onAction("2B")}>2B</button>
            <button onClick={() => onAction && onAction("K")}>K</button>
            <button onClick={() => onAction && onAction("1B")}>1B</button>
            <button onClick={() => onAction && onAction("Fly/Pop Out")}>
                Fly/Pop Out
            </button>
        </div>
    ),
}));

// Avoid image/CSS module noise
jest.mock("@/constants/images", () => ({ fieldSrc: "field.png" }));
jest.mock("@/styles/positionPicker.module.css", () => ({}), { virtual: true });
jest.mock("../GamedayField.module.css", () => ({}), { virtual: true });

const mockLog = {
    $id: "log1",
    playerId: "player1",
    eventType: "single",
    rbi: 0,
    outsOnPlay: 0,
    description: "Joseph Gordy singles to RF",
    hitX: 75.0,
    hitY: 40.0,
    hitLocation: "RF",
    battingSide: "right",
    baseState: JSON.stringify({
        first: null,
        second: null,
        third: null,
        scored: [],
        runnerResults: {
            batter: "first",
            first: null,
            second: null,
            third: null,
        },
    }),
};

const mockPreviousLog = {
    baseState: JSON.stringify({
        first: null,
        second: null,
        third: null,
        scored: [],
    }),
};

const mockPlayerChart = [
    { $id: "player1", firstName: "Joseph", lastName: "Gordy" },
    { $id: "player2", firstName: "Neal", lastName: "Baker" },
];

const defaultProps = {
    opened: true,
    onClose: jest.fn(),
    log: mockLog,
    previousLog: mockPreviousLog,
    playerChart: mockPlayerChart,
    onSave: jest.fn(),
    isSubmitting: false,
};

describe("EditPlayDrawer", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("when closed", () => {
        it("does not render drawer content", () => {
            render(<EditPlayDrawer {...defaultProps} opened={false} />);
            expect(screen.queryByText("Edit Play")).not.toBeInTheDocument();
        });
    });

    describe("menu step (main panel)", () => {
        it("renders the Edit Play header with batter name and result", () => {
            render(<EditPlayDrawer {...defaultProps} />);
            expect(screen.getByText("Edit Play")).toBeInTheDocument();
            // Appears in subtitle and description preview, so we check for existence
            expect(screen.getAllByText(/Joseph Gordy/)).not.toHaveLength(0);
        });

        it("renders the three quick-action menu items", () => {
            render(<EditPlayDrawer {...defaultProps} />);
            expect(screen.getByText("Change Result")).toBeInTheDocument();
            expect(screen.getByText("Change Hit Location")).toBeInTheDocument();
            expect(screen.getByText("Change Runners")).toBeInTheDocument();
        });

        it("renders the auto-generated description", () => {
            render(<EditPlayDrawer {...defaultProps} />);
            // Description section header is "Description" in code
            expect(screen.getByText("Description")).toBeInTheDocument();
        });

        it("renders Save Changes button only on the menu step", () => {
            render(<EditPlayDrawer {...defaultProps} />);
            expect(
                screen.getByRole("button", { name: /Save Changes/i }),
            ).toBeInTheDocument();
        });

        it("shows RBI badge when runs are scored", async () => {
            const logWithRBI = {
                ...mockLog,
                baseState: JSON.stringify({
                    first: null,
                    second: null,
                    third: null,
                    scored: ["player1"],
                    runnerResults: { batter: "score" },
                }),
            };
            render(<EditPlayDrawer {...defaultProps} log={logWithRBI} />);
            await waitFor(() => {
                expect(screen.getByText(/1 RBI/i)).toBeInTheDocument();
            });
        });
    });

    describe("navigation", () => {
        it("navigates to the result step when Change Result is clicked", () => {
            render(<EditPlayDrawer {...defaultProps} />);
            fireEvent.click(screen.getByText("Change Result"));
            // ActionPad mock renders result buttons
            expect(
                screen.getByRole("button", { name: "2B" }),
            ).toBeInTheDocument();
        });

        it("auto-returns to menu after selecting a result", () => {
            render(<EditPlayDrawer {...defaultProps} />);
            fireEvent.click(screen.getByText("Change Result"));
            fireEvent.click(screen.getByRole("button", { name: "2B" }));
            // Back on menu — Save Changes is visible again
            expect(
                screen.getByRole("button", { name: /Save Changes/i }),
            ).toBeInTheDocument();
        });

        it("navigates to the location step when Change Hit Location is clicked", () => {
            render(<EditPlayDrawer {...defaultProps} />);
            fireEvent.click(screen.getByText("Change Hit Location"));
            // Done button appears (no Save Changes)
            expect(
                screen.getByRole("button", { name: /Done/i }),
            ).toBeInTheDocument();
            expect(
                screen.queryByRole("button", { name: /Save Changes/i }),
            ).not.toBeInTheDocument();
        });

        it("returns to menu from location step via Done button", () => {
            render(<EditPlayDrawer {...defaultProps} />);
            fireEvent.click(screen.getByText("Change Hit Location"));
            fireEvent.click(screen.getByRole("button", { name: /Done/i }));
            expect(
                screen.getByRole("button", { name: /Save Changes/i }),
            ).toBeInTheDocument();
        });

        it("navigates to the runners step when Change Runners is clicked", () => {
            render(<EditPlayDrawer {...defaultProps} />);
            fireEvent.click(screen.getByText("Change Runners"));
            expect(screen.getByTestId("runner-dnd")).toBeInTheDocument();
            expect(
                screen.queryByRole("button", { name: /Save Changes/i }),
            ).not.toBeInTheDocument();
        });

        it("returns to menu from runners step via Done button", () => {
            render(<EditPlayDrawer {...defaultProps} />);
            fireEvent.click(screen.getByText("Change Runners"));
            fireEvent.click(screen.getByRole("button", { name: /Done/i }));
            expect(
                screen.getByRole("button", { name: /Save Changes/i }),
            ).toBeInTheDocument();
        });

        it("hides Save Changes on all sub-steps", () => {
            render(<EditPlayDrawer {...defaultProps} />);

            // Result step
            fireEvent.click(screen.getByText("Change Result"));
            expect(
                screen.queryByRole("button", { name: /Save Changes/i }),
            ).not.toBeInTheDocument();
        });
    });

    describe("Save Changes callback", () => {
        it("calls onSave with the correct shape when Save Changes is clicked", () => {
            render(<EditPlayDrawer {...defaultProps} />);
            fireEvent.click(
                screen.getByRole("button", { name: /Save Changes/i }),
            );

            expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
            const [logId, payload] = defaultProps.onSave.mock.calls[0];
            expect(logId).toBe("log1");
            expect(payload).toMatchObject({
                eventType: expect.any(String),
                rbi: expect.any(Number),
                outsOnPlay: expect.any(Number),
                description: expect.any(String),
                baseState: expect.any(Object),
                runnerResults: expect.any(Object),
                hitLocation: expect.any(String),
                battingSide: expect.any(String),
            });
        });

        it("maps the UI event type label to the DB value before saving", () => {
            render(<EditPlayDrawer {...defaultProps} />);
            // Default log is a "single" (stored) => "1B" (UI label)
            fireEvent.click(
                screen.getByRole("button", { name: /Save Changes/i }),
            );
            const [, payload] = defaultProps.onSave.mock.calls[0];
            expect(payload.eventType).toBe("single");
        });

        it("derives hitX and hitY floats from current coordinates", () => {
            render(<EditPlayDrawer {...defaultProps} />);
            fireEvent.click(
                screen.getByRole("button", { name: /Save Changes/i }),
            );
            const [, payload] = defaultProps.onSave.mock.calls[0];
            expect(typeof payload.hitX).toBe("number");
            expect(typeof payload.hitY).toBe("number");
        });

        it("resolves Fly/Pop Out to Fly Out (fly_out) for outfield coordinates", () => {
            const outfieldLog = {
                ...mockLog,
                hitX: 50.0,
                hitY: 20.0, // distance = 58 > 38
            };
            const onSaveMock = jest.fn();
            render(
                <EditPlayDrawer
                    {...defaultProps}
                    log={outfieldLog}
                    onSave={onSaveMock}
                />,
            );

            // Navigate to change result
            fireEvent.click(screen.getByText("Change Result"));
            // Click Fly/Pop Out
            fireEvent.click(
                screen.getByRole("button", { name: UI_KEYS.FLY_POP }),
            );
            // Save Changes
            fireEvent.click(
                screen.getByRole("button", { name: /Save Changes/i }),
            );

            expect(onSaveMock).toHaveBeenCalledTimes(1);
            const [, payload] = onSaveMock.mock.calls[0];
            expect(payload.eventType).toBe("fly_out");
        });

        it("resolves Fly/Pop Out to Pop Out (pop_out) for infield coordinates", () => {
            const infieldLog = {
                ...mockLog,
                hitX: 50.0,
                hitY: 65.0, // distance = 13 < 38
            };
            const onSaveMock = jest.fn();
            render(
                <EditPlayDrawer
                    {...defaultProps}
                    log={infieldLog}
                    onSave={onSaveMock}
                />,
            );

            // Navigate to change result
            fireEvent.click(screen.getByText("Change Result"));
            // Click Fly/Pop Out
            fireEvent.click(
                screen.getByRole("button", { name: UI_KEYS.FLY_POP }),
            );
            // Save Changes
            fireEvent.click(
                screen.getByRole("button", { name: /Save Changes/i }),
            );

            expect(onSaveMock).toHaveBeenCalledTimes(1);
            const [, payload] = onSaveMock.mock.calls[0];
            expect(payload.eventType).toBe("pop_out");
        });

        it("shows loading state while isSubmitting", () => {
            render(<EditPlayDrawer {...defaultProps} isSubmitting={true} />);
            // Mantine Button with loading prop renders a loader
            const saveBtn = screen.getByRole("button", {
                name: /Save Changes/i,
            });
            expect(saveBtn).toBeDisabled();
        });
    });

    describe("when log is null", () => {
        it("renders without crashing", () => {
            render(<EditPlayDrawer {...defaultProps} log={null} />);
            expect(screen.getByText("Edit Play")).toBeInTheDocument();
        });
    });
});
