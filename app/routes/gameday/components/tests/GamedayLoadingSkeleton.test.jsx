import { render } from "@/utils/test-utils";
import GamedayLoadingSkeleton, {
    MobileGamedayLoadingSkeleton,
} from "../GamedayLoadingSkeleton";

// Mocks to easily identify which component was rendered
jest.mock("../DesktopGamedayLoadingSkeleton", () => () => (
    <div data-testid="desktop-skeleton" />
));

describe("GamedayLoadingSkeleton", () => {
    it("renders mobile skeleton when isDesktop is false or undefined", () => {
        const { getByTestId } = render(
            <div data-testid="mobile-skeleton-wrapper">
                <GamedayLoadingSkeleton isDesktop={false} />
            </div>,
        );
        expect(getByTestId("mobile-skeleton-wrapper")).toBeInTheDocument();
    });

    it("renders desktop skeleton when isDesktop is true", () => {
        const { getByTestId } = render(
            <GamedayLoadingSkeleton isDesktop={true} />,
        );
        expect(getByTestId("desktop-skeleton")).toBeInTheDocument();
    });
});

describe("MobileGamedayLoadingSkeleton", () => {
    it("renders skeleton structure", () => {
        const { container } = render(<MobileGamedayLoadingSkeleton />);
        expect(container).toBeInTheDocument();
        const skeletons = container.querySelectorAll(".mantine-Skeleton-root");
        expect(skeletons.length).toBeGreaterThan(0);
    });
});
