import { render } from "@/utils/test-utils";
import DesktopGamedayLoadingSkeleton from "../DesktopGamedayLoadingSkeleton";

describe("DesktopGamedayLoadingSkeleton", () => {
    it("renders skeleton structure", () => {
        const { container } = render(<DesktopGamedayLoadingSkeleton />);

        // It's a skeleton, so mostly we just care that it renders without throwing
        expect(container).toBeInTheDocument();

        // Mantine Skeletons have the mantine-Skeleton-root class
        const skeletons = container.querySelectorAll(".mantine-Skeleton-root");
        expect(skeletons.length).toBeGreaterThan(0);
    });
});
