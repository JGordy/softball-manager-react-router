import { render, screen } from "@/utils/test-utils";
import { ItemCard } from "../ItemCard";

describe("ItemCard", () => {
    it("renders text and subText correctly", () => {
        render(<ItemCard text="Test Name" subText="Test SubText" />);

        expect(screen.getByText("Test Name")).toBeInTheDocument();
        expect(screen.getByText("Test SubText")).toBeInTheDocument();
    });

    it("renders rightSection when provided", () => {
        render(
            <ItemCard
                text="Test Name"
                rightSection={<span data-testid="right-section">Right</span>}
            />,
        );

        expect(screen.getByTestId("right-section")).toBeInTheDocument();
    });

    it("applies custom background color", () => {
        const { container } = render(
            <ItemCard text="Test" bgColor="#ff0000" />,
        );

        // Check if the paper has the background color style
        const paper = container.querySelector(".mantine-Paper-root");
        expect(paper).toHaveStyle({ backgroundColor: "rgb(255, 0, 0)" });
    });
});
