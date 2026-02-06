import { screen, cleanup } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import PlayerDetails from "../PlayerDetails";

describe("PlayerDetails Component", () => {
    afterEach(() => {
        cleanup();
    });

    const mockPlayer = {
        firstName: "Test",
        lastName: "Player",
        throws: "Right",
        bats: "Left",
        preferredPositions: ["Pitcher", "Shortstop"],
        dislikedPositions: ["Catcher"],
    };

    it("renders player throwing and batting info", () => {
        render(<PlayerDetails player={mockPlayer} />);

        expect(screen.getByText("Throws")).toBeInTheDocument();
        expect(screen.getByText("Right")).toBeInTheDocument();
        expect(screen.getByText("Bats")).toBeInTheDocument();
        expect(screen.getByText("Left")).toBeInTheDocument();
    });

    it("renders 'Not Listed' when attributes are missing", () => {
        const emptyPlayer = { ...mockPlayer, throws: null, bats: null };
        render(<PlayerDetails player={emptyPlayer} />);

        const notListedElements = screen.getAllByText("Not Listed");
        expect(notListedElements.length).toBeGreaterThanOrEqual(2);
    });

    it("renders legend for fielding preferences", () => {
        render(<PlayerDetails player={mockPlayer} />);

        expect(screen.getByText("Fielding Preferences")).toBeInTheDocument();
        expect(screen.getByText("Preferred")).toBeInTheDocument();
        expect(screen.getByText("Open")).toBeInTheDocument();
        expect(screen.getByText("Disliked")).toBeInTheDocument();
    });

    it("displays position chart image", () => {
        render(<PlayerDetails player={mockPlayer} />);
        // The main field image has alt "Preferred Positions Chart"
        expect(
            screen.getByAltText("Preferred Positions Chart"),
        ).toBeInTheDocument();
    });
});
