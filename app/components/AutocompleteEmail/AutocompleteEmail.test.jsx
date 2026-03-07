import { screen, fireEvent, cleanup, act } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import AutocompleteEmail from "./AutocompleteEmail";

describe("AutocompleteEmail Component", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        cleanup();
    });

    it("renders input with correct attributes", () => {
        render(<AutocompleteEmail label="Test Email" />);
        const input = screen.getByPlaceholderText("youremail@email.com");
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute("name", "email");
    });

    it("does not show suggestions immediately", () => {
        render(<AutocompleteEmail />);
        expect(screen.queryByText(/@gmail.com/i)).not.toBeInTheDocument();
    });

    it("shows suggestions after valid input", () => {
        render(<AutocompleteEmail />);
        const input = screen.getByPlaceholderText("youremail@email.com");

        fireEvent.change(input, { target: { value: "joe" } });

        act(() => {
            jest.advanceTimersByTime(300);
        });

        expect(screen.getByText("joe@gmail.com")).toBeInTheDocument();
    });

    it("does not trigger suggestions if input contains @", () => {
        render(<AutocompleteEmail />);
        const input = screen.getByPlaceholderText("youremail@email.com");

        fireEvent.change(input, { target: { value: "joe@" } });

        act(() => {
            jest.advanceTimersByTime(300);
        });

        expect(screen.queryByText("joe@gmail.com")).not.toBeInTheDocument();
    });
});
