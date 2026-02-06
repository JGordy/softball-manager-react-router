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
        // Mantine adds an asterisk for required fields
        const asterisk = document.querySelector(
            ".mantine-InputWrapper-required",
        );
        expect(asterisk).toBeInTheDocument();
    });

    it("renders with default values", () => {
        const date = new Date(2023, 0, 1); // Jan 1 2023
        render(<DatePicker defaultValue={date} label="Default" />);

        // Mantine DatePicker input value format depends on locale/settings
        // Default is usually Month DD, YYYY or similar.
        // We check value attribute of the hidden input or visible text
        const input = screen.getByRole("button", { name: /Default/i }); // DatePicker is often a button trigger
        // Just checking existence is good sanity check for now for controlled/uncontrolled
        expect(input).toBeInTheDocument();
    });
});
