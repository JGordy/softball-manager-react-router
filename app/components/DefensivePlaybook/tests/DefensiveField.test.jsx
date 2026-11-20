import { render, screen, fireEvent } from "@/utils/test-utils";
import DefensiveField, {
    DEFAULT_POSITIONS,
    FIELD_BASE_COORDINATES,
    PRIORITY_COLORS,
} from "../DefensiveField";

describe("DefensiveField Component", () => {
    const mockPlay = {
        id: "test-play-1",
        title: "Ground Ball to Shortstop - Out at 1B",
        category: "Bases Empty",
        subCategory: "Ground Ball",
        situation: {
            outs: 0,
            runners: ["1B", "2B"],
            batterHand: "R",
            hitType: "Hard grounder to 6",
            description: "SS fields and throws to 1B",
        },
        fielders: [
            {
                posId: "P",
                label: "Pitcher",
                role: "Back up 1B",
                priority: "backup",
                target: { x: 58, y: 56 },
            },
            {
                posId: "C",
                label: "Catcher",
                role: "Cover home",
                priority: "coverage",
                target: { x: 50, y: 78 },
            },
            {
                posId: "1B",
                label: "First Base",
                role: "Cover 1B bag",
                priority: "coverage",
                target: { x: 66, y: 56 },
            },
            {
                posId: "2B",
                label: "Second Base",
                role: "Cover 2B bag",
                priority: "coverage",
                target: { x: 50, y: 48 },
            },
            {
                posId: "3B",
                label: "Third Base",
                role: "Hold 3B bag",
                priority: "coverage",
                target: { x: 34, y: 56 },
            },
            {
                posId: "SS",
                label: "Shortstop",
                role: "Field ground ball",
                priority: "primary",
                target: { x: 42, y: 52 },
            },
            {
                posId: "LF",
                label: "Left Field",
                role: "Back up SS",
                priority: "backup",
                target: { x: 30, y: 42 },
            },
            {
                posId: "LC",
                label: "Left Center",
                role: "Back up SS/2B",
                priority: "backup",
                target: { x: 42, y: 35 },
            },
            {
                posId: "RC",
                label: "Right Center",
                role: "Shade toward 2B",
                priority: "backup",
                target: { x: 55, y: 33 },
            },
            {
                posId: "RF",
                label: "Right Field",
                role: "Back up throw to 1B",
                priority: "backup",
                target: { x: 70, y: 45 },
            },
        ],
        ballTimeline: [
            {
                step: 0.0,
                pos: { x: 50, y: 78 },
                elevation: 0,
                label: "Contact",
            },
            {
                step: 0.45,
                pos: { x: 42, y: 52 },
                elevation: 0,
                label: "Fielded by SS",
            },
            {
                step: 1.0,
                pos: { x: 66, y: 56 },
                elevation: 0,
                label: "Caught at 1B",
            },
        ],
    };

    it("exports valid default positions and priority color constants", () => {
        expect(DEFAULT_POSITIONS.P).toEqual({ x: 50, y: 62 });
        expect(FIELD_BASE_COORDINATES.Home).toEqual({ x: 50, y: 78 });
        expect(PRIORITY_COLORS.primary).toBe("#CCFF33");
        expect(PRIORITY_COLORS.cutoff).toBe("#FB923C");
        expect(PRIORITY_COLORS.coverage).toBe("#38BDF8");
        expect(PRIORITY_COLORS.backup).toBe("#C084FC");
    });

    it("renders field background image and accessible SVG container", () => {
        render(<DefensiveField play={mockPlay} />);
        expect(screen.getByAltText("Softball Field")).toBeInTheDocument();
        expect(
            screen.getByRole("img", {
                name: "Softball Defensive Field for Ground Ball to Shortstop - Out at 1B",
            }),
        ).toBeInTheDocument();
    });

    it("renders all 10 defensive fielders as interactive elements", () => {
        render(<DefensiveField play={mockPlay} />);
        const fielderButtons = screen.getAllByRole("button");
        expect(fielderButtons).toHaveLength(10);

        const ssButton = screen.getByRole("button", {
            name: "Shortstop (SS) - Field ground ball",
        });
        expect(ssButton).toBeInTheDocument();
    });

    it("calls onSelectFielder on click and on Enter keydown", () => {
        const handleSelect = jest.fn();
        render(
            <DefensiveField play={mockPlay} onSelectFielder={handleSelect} />,
        );

        const ssButton = screen.getByRole("button", {
            name: "Shortstop (SS) - Field ground ball",
        });

        fireEvent.click(ssButton);
        expect(handleSelect).toHaveBeenCalledWith("SS");

        fireEvent.keyDown(ssButton, { key: "Enter" });
        expect(handleSelect).toHaveBeenCalledWith("SS");

        fireEvent.keyDown(ssButton, { key: " " });
        expect(handleSelect).toHaveBeenCalledWith("SS");
    });

    it("toggles movement vector arrows when showVectors is true or false", () => {
        const { container, rerender } = render(
            <DefensiveField play={mockPlay} showVectors={true} />,
        );
        const vectorLines = container.querySelectorAll("line");
        expect(vectorLines.length).toBeGreaterThan(0);

        rerender(<DefensiveField play={mockPlay} showVectors={false} />);
        const hiddenVectorLines = container.querySelectorAll("line");
        expect(hiddenVectorLines.length).toBe(0);
    });

    it("renders distinct hit (white) and throw (lime) trajectory paths and base runner indicators", () => {
        const { container } = render(<DefensiveField play={mockPlay} />);

        // Hit trajectory in white (#FFFFFF)
        const hitPath = container.querySelector('path[stroke="#FFFFFF"]');
        expect(hitPath).toBeInTheDocument();

        // Throw trajectory in neon lime (#CCFF33)
        const throwPath = container.querySelector('path[stroke="#CCFF33"]');
        expect(throwPath).toBeInTheDocument();

        // Runner bag highlights exist for 1B and 2B
        const runnerRings = container.querySelectorAll(
            'circle[fill="rgba(204, 255, 51, 0.3)"]',
        );
        expect(runnerRings).toHaveLength(2);
    });

    it("renders selected fielder with active halo circle", () => {
        const { container } = render(
            <DefensiveField play={mockPlay} selectedFielderId="SS" />,
        );
        const halo = container.querySelector(
            'circle[stroke="#CCFF33"][stroke-width="1.0"]',
        );
        expect(halo).toBeInTheDocument();
    });
});
