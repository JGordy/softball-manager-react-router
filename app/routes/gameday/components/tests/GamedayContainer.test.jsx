import { render, screen } from "@/utils/test-utils";
import GamedayContainer from "../GamedayContainer";

jest.mock("../MobileGamedayContainer", () => () => (
    <div data-testid="mobile-container" />
));
jest.mock("../DesktopGamedayContainer", () => () => (
    <div data-testid="desktop-container" />
));

describe("GamedayContainer Wrapper", () => {
    it("renders MobileGamedayContainer when isDesktop is false", () => {
        render(<GamedayContainer isDesktop={false} />);
        expect(screen.getByTestId("mobile-container")).toBeInTheDocument();
        expect(
            screen.queryByTestId("desktop-container"),
        ).not.toBeInTheDocument();
    });

    it("renders DesktopGamedayContainer when isDesktop is true", () => {
        render(<GamedayContainer isDesktop={true} />);
        expect(screen.getByTestId("desktop-container")).toBeInTheDocument();
        expect(
            screen.queryByTestId("mobile-container"),
        ).not.toBeInTheDocument();
    });
});
