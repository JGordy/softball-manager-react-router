import { render, screen } from "@/utils/test-utils";

import AlertIncomplete from "../AlertIncomplete";

describe("AlertIncomplete Component", () => {
    const incompleteData = [
        { label: "phone number" },
        { label: "preferred positions" },
    ];

    it("renders correctly with incomplete data", () => {
        render(<AlertIncomplete incompleteData={incompleteData} />);

        expect(
            screen.getByText("Your profile is incomplete!"),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Please provide the following information:"),
        ).toBeInTheDocument();
        expect(screen.getByText("phone number")).toBeInTheDocument();
        expect(screen.getByText("preferred positions")).toBeInTheDocument();
    });

    it("renders nothing or empty list if incompleteData is empty", () => {
        render(<AlertIncomplete incompleteData={[]} />);

        expect(
            screen.getByText("Your profile is incomplete!"),
        ).toBeInTheDocument();
        expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });
});
