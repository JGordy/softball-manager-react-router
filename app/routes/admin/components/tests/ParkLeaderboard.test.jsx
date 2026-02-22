import { render, screen } from "@/utils/test-utils";
import { ParkLeaderboard } from "../ParkLeaderboard";

describe("ParkLeaderboard", () => {
    const mockParks = [
        { id: "p1", name: "Central Park", gameCount: 15 },
        { id: "p2", name: "West Park", gameCount: 10 },
        { id: "p3", name: "Riverside", gameCount: 5 },
    ];

    it("renders park names and game counts", () => {
        render(<ParkLeaderboard topParks={mockParks} />);

        expect(screen.getByText("Park Activity")).toBeInTheDocument();
        expect(screen.getByText("Central Park")).toBeInTheDocument();
        expect(screen.getByText(/15/)).toBeInTheDocument();
    });

    it("returns null if no parks are provided", () => {
        render(<ParkLeaderboard topParks={[]} />);
        expect(screen.queryByText("Park Activity")).not.toBeInTheDocument();
    });

    it("returns null if topParks is missing", () => {
        render(<ParkLeaderboard topParks={null} />);
        expect(screen.queryByText("Park Activity")).not.toBeInTheDocument();
    });
});
