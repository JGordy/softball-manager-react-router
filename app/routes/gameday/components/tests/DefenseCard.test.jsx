import { render, screen } from "@/utils/test-utils";
import DefenseCard from "../DefenseCard";

describe("DefenseCard", () => {
    it("renders team name", () => {
        render(<DefenseCard teamName="Tigers" />);
        expect(screen.getByText("Tigers")).toBeInTheDocument();
        expect(screen.getByText("ON DEFENSE")).toBeInTheDocument();
    });
});
