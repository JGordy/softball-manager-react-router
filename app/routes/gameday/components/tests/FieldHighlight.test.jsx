import { render } from "@/utils/test-utils";
import FieldHighlight from "../FieldHighlight";

describe("FieldHighlight", () => {
    it("renders nothing when x or y props are null", () => {
        const { container } = render(
            <FieldHighlight x={null} y={null} actionType="1B" />,
        );
        expect(container.querySelector("path")).not.toBeInTheDocument();
    });

    it("renders field highlight when valid coordinates are provided", () => {
        const { container } = render(
            <FieldHighlight x={50} y={50} actionType="1B" />,
        );
        // It renders an SVG path
        expect(container.querySelector("path")).toBeInTheDocument();
    });

    it("does not render when hit is foul", () => {
        // Assume coordinates far left or right
        const { container } = render(
            <FieldHighlight x={0} y={50} actionType="1B" />,
        );
        // Should be empty as it returns null for foul balls (based on logic)
        expect(container.querySelector("path")).not.toBeInTheDocument();
    });
});
