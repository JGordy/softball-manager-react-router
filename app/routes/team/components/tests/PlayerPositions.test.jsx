import { render, screen } from "@/utils/test-utils";
import PlayerPositions from "../PlayerPositions";

describe("PlayerPositions Component", () => {
    it("renders empty group when no positions provided", () => {
        render(<PlayerPositions preferredPositions={[]} playerId="p1" />);
        expect(screen.queryByText(/SS/i)).not.toBeInTheDocument();
    });

    it("renders positions up to 4 without overflow", () => {
        const positions = ["Shortstop", "First Base", "Second Base"];
        render(
            <PlayerPositions preferredPositions={positions} playerId="p1" />,
        );

        // Assert abbreviations are rendered via the avatar name initials logic
        // Because of Mantine's Avatar structure, the inner text represents initials,
        // but test-utils allows searching by text.
        expect(screen.getByText("SS")).toBeInTheDocument();
        expect(screen.getByText("1B")).toBeInTheDocument();
        expect(screen.getByText("2B")).toBeInTheDocument();
    });

    it("renders exact 4 positions without overflow indicator", () => {
        const positions = [
            "Shortstop",
            "First Base",
            "Second Base",
            "Third Base",
        ];
        render(
            <PlayerPositions preferredPositions={positions} playerId="p1" />,
        );

        expect(screen.getByText("SS")).toBeInTheDocument();
        expect(screen.getByText("1B")).toBeInTheDocument();
        expect(screen.getByText("2B")).toBeInTheDocument();
        expect(screen.getByText("3B")).toBeInTheDocument();
        expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    });

    it("renders top 3 and an overflow indicator when more than 4 positions", () => {
        const positions = [
            "Shortstop",
            "First Base",
            "Second Base",
            "Third Base",
            "Left Field",
            "Right Field",
        ];
        render(
            <PlayerPositions preferredPositions={positions} playerId="p1" />,
        );

        // Only 3 should be visible
        expect(screen.getByText("SS")).toBeInTheDocument();
        expect(screen.getByText("1B")).toBeInTheDocument();
        expect(screen.getByText("2B")).toBeInTheDocument();

        // Overflow count: 6 total - 3 visible = 3
        expect(screen.getByText("+3")).toBeInTheDocument();
    });
});
