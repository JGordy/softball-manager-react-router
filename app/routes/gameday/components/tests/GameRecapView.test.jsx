import { render, screen } from "@/utils/test-utils";
import GameRecapView from "../GameRecapView";

// Mock useFetcher
const mockForm = ({ children, ...props }) => (
    <form data-testid="fetcher-form" {...props}>
        {children}
    </form>
);
const mockFetcher = {
    Form: mockForm,
    state: "idle",
    submit: jest.fn(),
};

jest.mock("react-router", () => ({
    useFetcher: () => mockFetcher,
}));

describe("GameRecapView", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFetcher.state = "idle";
    });

    it("renders null if no recap and logs are empty", () => {
        const { container } = render(
            <GameRecapView recap={null} logs={[]} isScorekeeper={false} />,
        );
        expect(container.querySelector(".mantine-Card-root")).toBeNull();
    });

    it("renders CTA panel if no recap but logs are present", () => {
        render(
            <GameRecapView
                recap={null}
                logs={[{ id: "log-1", description: "Batter hits a single" }]}
                isScorekeeper={false}
            />,
        );

        expect(screen.getByText("No Game Recap Yet")).toBeInTheDocument();
        expect(
            screen.getByText(
                /This game was finalized without generating a recap/i,
            ),
        ).toBeInTheDocument();
    });

    it("displays the Generate AI Recap button for scorekeepers", () => {
        render(
            <GameRecapView
                recap={null}
                logs={[{ id: "log-1", description: "Batter hits a single" }]}
                isScorekeeper={true}
            />,
        );

        expect(
            screen.getByRole("button", { name: "Generate AI Recap" }),
        ).toBeInTheDocument();
    });

    it("shows generic manager instruction text for non-scorekeepers", () => {
        render(
            <GameRecapView
                recap={null}
                logs={[{ id: "log-1", description: "Batter hits a single" }]}
                isScorekeeper={false}
            />,
        );

        expect(
            screen.queryByRole("button", { name: "Generate AI Recap" }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByText(
                "Ask a team manager or scorekeeper to generate the recap column.",
            ),
        ).toBeInTheDocument();
    });

    it("shows loader state on the button when generating", () => {
        mockFetcher.state = "submitting"; // Change to active state
        render(
            <GameRecapView
                recap={null}
                logs={[{ id: "log-1", description: "Batter hits a single" }]}
                isScorekeeper={true}
            />,
        );

        expect(screen.getByText("Writing Recap Column...")).toBeInTheDocument();
    });

    it("renders the markdown recap text when provided", () => {
        const testMarkdown = `# Game Recap\n\n**Sliders** win the game!\n\n- Play 1\n- Play 2`;
        render(
            <GameRecapView
                recap={testMarkdown}
                logs={[]}
                isScorekeeper={false}
            />,
        );

        expect(screen.getByText("AI Sports Column")).toBeInTheDocument();
        expect(screen.getByText(/Game Recap/)).toBeInTheDocument();
        expect(screen.getByText(/Sliders/)).toBeInTheDocument();
        expect(screen.getByText(/win the game!/)).toBeInTheDocument();
        expect(screen.getByText(/Play 1/)).toBeInTheDocument();
        expect(screen.getByText(/Play 2/)).toBeInTheDocument();
    });
});
