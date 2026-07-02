import { render, screen } from "@/utils/test-utils";
import FieldLineupPreview from "../FieldLineupPreview";

// Mock constants/images
jest.mock("@/constants/images", () => ({
    fieldSrc: "mocked-field-image.png",
}));

describe("FieldLineupPreview Component", () => {
    it("renders nothing if playerChart is null, undefined, or empty", () => {
        render(<FieldLineupPreview playerChart={null} />);
        expect(
            screen.queryByTestId("field-lineup-preview"),
        ).not.toBeInTheDocument();

        render(<FieldLineupPreview playerChart={undefined} />);
        expect(
            screen.queryByTestId("field-lineup-preview"),
        ).not.toBeInTheDocument();

        render(<FieldLineupPreview playerChart={[]} />);
        expect(
            screen.queryByTestId("field-lineup-preview"),
        ).not.toBeInTheDocument();
    });

    it("renders the field image and active Inning 1 players", () => {
        const mockPlayerChart = [
            {
                $id: "player1",
                firstName: "Johnny",
                lastName: "Appleseed",
                positions: ["Third Base", "First Base"],
            },
            {
                $id: "player2",
                firstName: "Sally",
                lastName: "Smith",
                positions: ["First Base", "Shortstop"],
            },
            {
                $id: "player3",
                firstName: "Bobby",
                lastName: "Brown",
                positions: ["Out", "Left Field"], // Inning 1 is "Out", should not render
            },
        ];

        render(<FieldLineupPreview playerChart={mockPlayerChart} />);

        // Image should be rendered
        const img = screen.getByAltText(
            "Softball infield diagram showing player positions",
        );
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "mocked-field-image.png");

        // Active players in Inning 1 (Johnny -> 3B, Sally -> 1B) should be rendered
        expect(screen.getByText("3B")).toBeInTheDocument();
        expect(screen.getByText("Johnny")).toBeInTheDocument();

        expect(screen.getByText("1B")).toBeInTheDocument();
        expect(screen.getByText("Sally")).toBeInTheDocument();

        // Inactive player in Inning 1 (Bobby -> Out) should NOT be rendered
        expect(screen.queryByText("Bobby")).not.toBeInTheDocument();
    });
});
