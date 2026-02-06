import { screen, cleanup } from "@testing-library/react";
import { render } from "@/utils/test-utils";

import DatePicker from "../DatePicker";

describe("DatePicker Component", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders the label correctly", () => {
        render(<DatePicker label="Select Date" />);
        expect(screen.getByText("Select Date")).toBeInTheDocument();
    });

    it("passes placeholder to input", () => {
        render(<DatePicker placeholder="YYYY-MM-DD" />);
        // Mantine DatePicker renders placeholder in a button
        const input = screen.getByRole("button", { name: "YYYY-MM-DD" });
        expect(input).toBeInTheDocument();
    });

    it("sets input as required when prop is true", () => {
        render(<DatePicker required label="Required Date" />);
        // Assert that the DatePicker control is marked as required
        const input = screen.getByRole("button", { name: /Required Date/i });
        // Although 'required' on a button isn't valid HTML5, Mantine applies passed props to the element.
        expect(input).toHaveAttribute("required");
    });

    it("renders with default values", () => {
        const date = new Date(2023, 0, 1); // Jan 1 2023
        render(<DatePicker defaultValue={date} label="Default" />);

        // Verify the formatted date text is visible
        // Mantine default format is typically "MMMM D, YYYY" (e.g., January 1, 2023)
        expect(screen.getByText(/January 1, 2023/i)).toBeInTheDocument();
    });
});
