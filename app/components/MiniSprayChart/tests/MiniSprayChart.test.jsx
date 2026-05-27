import { render, screen } from "@/utils/test-utils";
import MiniSprayChart from "../MiniSprayChart";

describe("MiniSprayChart", () => {
    const mockHits = [
        {
            $id: "hit1",
            eventType: "single",
            hitX: 45,
            hitY: 60,
            hitLocation: "Left Field",
        },
        {
            $id: "hit2",
            eventType: "double",
            hitX: 55,
            hitY: 40,
            hitLocation: "Right Field",
        },
    ];

    it("renders nothing if there are no hits or no hits with valid coordinates", () => {
        const { container } = render(<MiniSprayChart hits={[]} />);
        // Should effectively be empty (ignoring style tags injected by Mantine)
        const contentWithoutStyles = Array.from(container.children).filter(
            (child) => child.tagName !== "STYLE",
        );
        expect(contentWithoutStyles.length).toBe(0);

        const hitsWithoutCoords = [
            { $id: "hit3", eventType: "single", hitLocation: "Center" },
        ];
        const { container: containerNoCoords } = render(
            <MiniSprayChart hits={hitsWithoutCoords} />,
        );
        const contentNoCoords = Array.from(containerNoCoords.children).filter(
            (child) => child.tagName !== "STYLE",
        );
        expect(contentNoCoords.length).toBe(0);
    });

    it("renders softball field image and SVG overlay when valid hits exist", () => {
        const { container } = render(<MiniSprayChart hits={mockHits} />);

        const fieldImage = screen.getByAltText("Softball Field");
        expect(fieldImage).toBeInTheDocument();

        // Check if correct number of hit markers are rendered
        const markers = container.querySelectorAll(".hitMarker");
        expect(markers.length).toBe(2);
    });

    it("applies special highlighted scaling to the most recent hit", () => {
        const { container } = render(<MiniSprayChart hits={mockHits} />);

        // Box markers are div elements inside the Card with .hitMarker class.
        // The first hit is old (not last), should have scale(0.8), opacity: 0.6
        // The second hit is last, should have scale(1.5), opacity: 1, zIndex: 10
        const markers = container.querySelectorAll(".hitMarker");
        expect(markers).toHaveLength(2);

        const firstMarker = markers[0];
        const secondMarker = markers[1];

        expect(firstMarker.style.transform).toContain("scale(0.8)");
        expect(firstMarker.style.opacity).toBe("0.6");

        expect(secondMarker.style.transform).toContain("scale(1.5)");
        expect(secondMarker.style.opacity).toBe("1");
        expect(secondMarker.style.zIndex).toBe("10");
    });
});
