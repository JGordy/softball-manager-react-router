import { render, screen } from "@/utils/test-utils";
import StatusBadge from "../StatusBadge";

describe("StatusBadge", () => {
    it("renders 'Live' when status is 'connected'", () => {
        render(<StatusBadge status="connected" />);
        expect(screen.getByText("Live")).toBeInTheDocument();
    });

    it("renders 'Syncing...' when status is 'connecting'", () => {
        render(<StatusBadge status="connecting" />);
        expect(screen.getByText("Syncing...")).toBeInTheDocument();
    });

    it("renders 'Updating...' when status is 'syncing'", () => {
        render(<StatusBadge status="syncing" />);
        expect(screen.getByText("Updating...")).toBeInTheDocument();
    });

    it("renders 'Offline' when status is 'error'", () => {
        render(<StatusBadge status="error" />);
        expect(screen.getByText("Offline")).toBeInTheDocument();
    });

    it("is hidden when status is 'idle'", () => {
        const { container } = render(<StatusBadge status="idle" />);
        // The idle status has style: { display: "none" }
        const badge = container.querySelector(".mantine-Badge-root");
        expect(badge).toHaveStyle({ display: "none" });
    });

    it("is hidden when no status is provided", () => {
        const { container } = render(<StatusBadge />);
        const badge = container.querySelector(".mantine-Badge-root");
        expect(badge).toHaveStyle({ visibility: "hidden" });
    });
});
