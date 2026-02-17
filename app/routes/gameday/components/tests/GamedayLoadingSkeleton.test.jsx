import { render, screen } from "@/utils/test-utils";
import GamedayLoadingSkeleton from "../GamedayLoadingSkeleton";

describe("GamedayLoadingSkeleton", () => {
    it("renders skeleton structure", () => {
        const { container } = render(<GamedayLoadingSkeleton />);
        expect(container.firstChild).toBeInTheDocument();
        // Mantine Skeletons usually render as divs
        expect(
            container.querySelectorAll(".mantine-Skeleton-root").length,
        ).toBeGreaterThan(5);
    });
});
