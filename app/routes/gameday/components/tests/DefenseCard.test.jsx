import { render, screen } from "@/utils/test-utils";
import DefenseCard from "../DefenseCard";

describe("DefenseCard", () => {
    it("renders team name", () => {
        render(<DefenseCard teamName="Tigers" />);
        expect(screen.getByText("Tigers")).toBeInTheDocument();
        expect(screen.getByText("ON DEFENSE")).toBeInTheDocument();
    });

    it("renders dueUpBatters when provided", () => {
        const mockBatters = [
            { $id: "1", firstName: "Joseph", lastName: "Gordy" },
            { $id: "2", firstName: "Neal", lastName: "B" },
            { $id: "3", firstName: "Blake", lastName: "" },
        ];

        render(<DefenseCard teamName="Tigers" dueUpBatters={mockBatters} />);

        expect(screen.getByText("DUE UP")).toBeInTheDocument();
        expect(screen.getByText("Joseph G.")).toBeInTheDocument();
        expect(screen.getByText("Neal B.")).toBeInTheDocument();
        expect(screen.getByText("Blake")).toBeInTheDocument();
    });

    it("does not render DUE UP section when dueUpBatters is empty", () => {
        render(<DefenseCard teamName="Tigers" dueUpBatters={[]} />);
        expect(screen.queryByText("DUE UP")).not.toBeInTheDocument();
    });
});
