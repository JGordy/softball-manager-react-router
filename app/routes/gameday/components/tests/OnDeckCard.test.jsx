import { render, screen } from "@/utils/test-utils";
import OnDeckCard from "../OnDeckCard";

describe("OnDeckCard", () => {
    const mockBatter = { firstName: "Jane", lastName: "Smith" };

    it("renders nothing if no batter", () => {
        const { container } = render(<OnDeckCard onDeckBatter={null} />);
        // Should effectively be empty (ignoring style tags injected by Mantine)
        const contentWithoutStyles = Array.from(container.children).filter(
            (child) => child.tagName !== "STYLE",
        );
        expect(contentWithoutStyles.length).toBe(0);
    });

    it("renders batter name", () => {
        render(<OnDeckCard onDeckBatter={mockBatter} />);
        expect(screen.getByText("ON DECK")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
});
