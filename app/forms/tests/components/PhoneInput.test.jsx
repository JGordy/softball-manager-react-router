import { render, screen } from "@/utils/test-utils";

import PhoneInput from "../../components/PhoneInput";

describe("PhoneInput", () => {
    it("renders correctly with label", () => {
        render(<PhoneInput defaultValue="" />);
        expect(screen.getByText("Phone Number")).toBeInTheDocument();
        // The input itself
        expect(
            screen.getByPlaceholderText("(xxx) xxx-xxxx"),
        ).toBeInTheDocument();
    });

    it("displays the default value formatted", () => {
        // IMask should handle formatting if JS runs.
        // jsdom might not fully support all input events for mask, but it should render defaultValue.
        render(<PhoneInput defaultValue="1234567890" />);

        const input = screen.getByPlaceholderText("(xxx) xxx-xxxx");
        expect(input).toHaveValue("(123) 456-7890");
    });
});
