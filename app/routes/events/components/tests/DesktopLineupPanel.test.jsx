import { render, screen, fireEvent } from "@/utils/test-utils";
import * as analyticsUtils from "@/utils/analytics";
import DesktopLineupPanel from "../DesktopLineupPanel";

jest.mock("react-router", () => ({
    Link: ({ to, children, ...props }) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
}));

jest.mock("@/components/PlayerChart", () => () => (
    <div data-testid="player-chart">Player Chart</div>
));

jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

const originalOpen = window.open;
beforeAll(() => {
    window.open = jest.fn(() => ({
        document: {
            title: "",
            createElement: jest.fn(() => ({ textContent: "" })),
            head: { appendChild: jest.fn() },
            body: { innerHTML: "" },
        },
        focus: jest.fn(),
        print: jest.fn(),
        close: jest.fn(),
    }));
});
afterAll(() => {
    window.open = originalOpen;
});

describe("DesktopLineupPanel", () => {
    const defaultProps = {
        game: { $id: "game1" },
        managerView: false,
        playerChart: null,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the lineup section header", () => {
        render(<DesktopLineupPanel {...defaultProps} />);
        expect(screen.getByText("Lineup & Field Chart")).toBeInTheDocument();
    });

    it("shows 'not yet available' message for non-manager without chart", () => {
        render(<DesktopLineupPanel {...defaultProps} />);
        expect(
            screen.getByText(/Lineup not yet available/),
        ).toBeInTheDocument();
    });

    it("shows manager empty-state message when managerView and no chart", () => {
        render(<DesktopLineupPanel {...defaultProps} managerView={true} />);
        expect(screen.getByText(/No lineup created yet/)).toBeInTheDocument();
    });

    it("renders player chart when playerChart is provided", () => {
        render(
            <DesktopLineupPanel
                {...defaultProps}
                playerChart={{ id: "chart1" }}
            />,
        );
        expect(screen.getByTestId("player-chart")).toBeInTheDocument();
    });

    it("shows Create button for manager without chart", () => {
        render(<DesktopLineupPanel {...defaultProps} managerView={true} />);
        expect(screen.getByText("Create")).toBeInTheDocument();
    });

    it("shows Edit button for manager with chart", () => {
        render(
            <DesktopLineupPanel
                {...defaultProps}
                managerView={true}
                playerChart={{ id: "chart1" }}
            />,
        );
        expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    it("shows Print button when playerChart exists", () => {
        render(
            <DesktopLineupPanel
                {...defaultProps}
                playerChart={{ id: "chart1" }}
            />,
        );
        expect(screen.getByText("Print")).toBeInTheDocument();
    });

    it("opens a print window and tracks event when Print clicked", () => {
        // Provide a real table element so querySelector('.printable table') resolves
        const table = document.createElement("table");
        const printableDiv = document.createElement("div");
        printableDiv.className = "printable";
        printableDiv.appendChild(table);
        document.body.appendChild(printableDiv);

        render(
            <DesktopLineupPanel
                {...defaultProps}
                playerChart={{ id: "chart1" }}
            />,
        );
        fireEvent.click(screen.getByText("Print"));
        expect(window.open).toHaveBeenCalledWith(
            "",
            "_blank",
            "noopener,noreferrer",
        );
        expect(analyticsUtils.trackEvent).toHaveBeenCalledWith("print-lineup", {
            eventId: "game1",
        });

        document.body.removeChild(printableDiv);
    });

    it("does NOT show Edit/Create button for non-manager", () => {
        render(<DesktopLineupPanel {...defaultProps} managerView={false} />);
        expect(screen.queryByText("Create")).not.toBeInTheDocument();
        expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    });
});
