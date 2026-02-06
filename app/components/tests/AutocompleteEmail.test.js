import { screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { render } from "@/utils/test-utils";
import AutocompleteEmail from "../AutocompleteEmail";

describe("AutocompleteEmail Component", () => {
    afterEach(() => {
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

    it("shows suggestions after valid input", async () => {
        render(<AutocompleteEmail />);
        const input = screen.getByPlaceholderText("youremail@email.com");

        fireEvent.change(input, { target: { value: "joe" } });

        await waitFor(() => {
            expect(screen.getByText("joe@gmail.com")).toBeInTheDocument();
        });
    });

    it("does not trigger suggestions if input contains @", async () => {
        render(<AutocompleteEmail />);
        const input = screen.getByPlaceholderText("youremail@email.com");

        fireEvent.change(input, { target: { value: "joe@" } });

        await new Promise((r) => setTimeout(r, 100));

        expect(screen.queryByText("joe@@gmail.com")).not.toBeInTheDocument();
    });
});
