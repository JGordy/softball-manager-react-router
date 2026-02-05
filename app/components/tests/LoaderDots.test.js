import { render, screen } from "@/utils/test-utils";
import LoaderDots from "../LoaderDots";

describe("LoaderDots", () => {
    it("renders the loader without crashing", () => {
        const { container } = render(<LoaderDots />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it("renders the optional message", () => {
        const message = "Loading data...";
        render(<LoaderDots message={message} />);
        expect(screen.getByText(message)).toBeInTheDocument();
    });
});
