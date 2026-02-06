import { screen, fireEvent, cleanup } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import { GoogleButton } from "../GoogleButton";

describe("GoogleButton Component", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders with correct text", () => {
        render(<GoogleButton />);
        expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
    });

    it("calls onClick handler when clicked", () => {
        const handleClick = jest.fn();
        render(<GoogleButton onClick={handleClick} />);

        const button = screen.getByRole("button");
        fireEvent.click(button);

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("renders as disabled when disabled prop is true", () => {
        render(<GoogleButton disabled />);
        const button = screen.getByRole("button");
        expect(button).toBeDisabled();
    });
});
