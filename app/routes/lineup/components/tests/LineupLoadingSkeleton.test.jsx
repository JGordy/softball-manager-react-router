import { render, screen } from "@/utils/test-utils";
import LineupLoadingSkeleton from "../LineupLoadingSkeleton";

describe("LineupLoadingSkeleton", () => {
    it("renders smoothly without crashing", () => {
        render(<LineupLoadingSkeleton />);

        // Since it's a structural skeleton, we just ensure its core building blocks render
        expect(screen.getByTestId("lineup-skeleton")).toBeInTheDocument();
    });
});
