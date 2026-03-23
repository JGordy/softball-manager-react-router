import { render, screen } from "@/utils/test-utils";
import UpNextCard from "../UpNextCard";

describe("UpNextCard", () => {
    const mockBatters = [
        { $id: "1", firstName: "Jane", lastName: "Smith" },
        { $id: "2", firstName: "John", lastName: "Doe" },
        { $id: "3", firstName: "Alice", lastName: "Wonder" },
    ];

    it("renders nothing if no upcoming batters", () => {
        const { container } = render(<UpNextCard upcomingBatters={null} />);
        const contentWithoutStyles = Array.from(container.children).filter(
            (child) => child.tagName !== "STYLE",
        );
        expect(contentWithoutStyles.length).toBe(0);
    });

    it("renders nothing if upcoming batters array is empty", () => {
        const { container } = render(<UpNextCard upcomingBatters={[]} />);
        const contentWithoutStyles = Array.from(container.children).filter(
            (child) => child.tagName !== "STYLE",
        );
        expect(contentWithoutStyles.length).toBe(0);
    });

    it("renders single batter names correctly", () => {
        render(<UpNextCard upcomingBatters={[mockBatters[0]]} />);
        expect(screen.getByText("UP NEXT")).toBeInTheDocument();
        expect(screen.getByText("Jane S.")).toBeInTheDocument();
        expect(screen.queryByText("•")).not.toBeInTheDocument();
    });

    it("renders multiple batters names separated by bullet", () => {
        render(<UpNextCard upcomingBatters={mockBatters} />);
        expect(screen.getByText("UP NEXT")).toBeInTheDocument();
        expect(screen.getByText("Jane S.")).toBeInTheDocument();
        expect(screen.getByText("John D.")).toBeInTheDocument();
        expect(screen.getByText("Alice W.")).toBeInTheDocument();
        expect(screen.getAllByText("•")).toHaveLength(2);
    });
});
