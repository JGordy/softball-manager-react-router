import { render, screen } from "@/utils/test-utils";
import DiamondView from "../DiamondView";

describe("DiamondView", () => {
    it("renders without title by default", () => {
        render(
            <DiamondView
                runners={{ first: null, second: null, third: null }}
            />,
        );
        expect(screen.getByText("ON BASE")).toBeInTheDocument();
    });

    it("renders without title if withTitle prop is false", () => {
        render(
            <DiamondView
                runners={{ first: null, second: null, third: null }}
                withTitle={false}
            />,
        );
        expect(screen.queryByText("ON BASE")).not.toBeInTheDocument();
    });

    it("highlights occupied bases", () => {
        const runners = { first: "p1", second: null, third: "p3" };
        render(<DiamondView runners={runners} />);

        const firstBase = screen.getByLabelText("First Base");
        const secondBase = screen.getByLabelText("Second Base");
        const thirdBase = screen.getByLabelText("Third Base");

        // Occupied bases should have blue background
        expect(firstBase.getAttribute("style")).toContain(
            "var(--mantine-color-blue-filled)",
        );
        expect(thirdBase.getAttribute("style")).toContain(
            "var(--mantine-color-blue-filled)",
        );

        // Empty base should have white background
        expect(secondBase.getAttribute("style")).toContain(
            "background-color: white",
        );
    });
});
