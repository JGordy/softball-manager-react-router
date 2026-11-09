import { render, screen } from "@/utils/test-utils";
import RoleLegend from "../RoleLegend";

describe("RoleLegend Component", () => {
    it("renders the role legend container with proper accessibility label", () => {
        render(<RoleLegend />);
        const legend = screen.getByRole("group", {
            name: /fielder role color legend/i,
        });
        expect(legend).toBeInTheDocument();
    });

    it("renders all tactical roles and trajectory keys with their labels", () => {
        render(<RoleLegend />);
        expect(screen.getByText("Primary")).toBeInTheDocument();
        expect(screen.getByText("Cutoff")).toBeInTheDocument();
        expect(screen.getByText("Coverage")).toBeInTheDocument();
        expect(screen.getByText("Backup")).toBeInTheDocument();
        expect(screen.getByText("Hit")).toBeInTheDocument();
        expect(screen.getByText("Throw")).toBeInTheDocument();
    });
});
