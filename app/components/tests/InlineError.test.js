import { screen } from "@testing-library/react";
import { render } from "../../utils/test-utils";
import InlineError from "../InlineError";

describe("InlineError Component", () => {
    it("renders with default message", () => {
        render(<InlineError />);
        expect(screen.getByText("Error loading data")).toBeInTheDocument();
    });

    it("renders with custom message prop", () => {
        const customMessage = "Something went wrong";
        render(<InlineError message={customMessage} />);
        expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it("spreads additional props", () => {
        render(<InlineError data-testid="inline-error" />);
        const element = screen.getByTestId("inline-error");
        expect(element).toBeInTheDocument();
    });
});
