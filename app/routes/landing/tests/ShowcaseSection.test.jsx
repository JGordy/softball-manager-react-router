import { render, screen } from "@/utils/test-utils";

import ShowcaseSection from "../components/ShowcaseSection";

describe("ShowcaseSection", () => {
    // Suppress expected console errors from image key collisions in test environment
    beforeAll(() => {
        jest.spyOn(console, "error").mockImplementation((msg) => {
            if (msg.includes("Encountered two children with the same key"))
                return;

            console.warn(msg);
        });
    });

    afterAll(() => {
        console.error.mockRestore();
    });

    it("renders 'Score games in real-time' section", () => {
        render(<ShowcaseSection />);
        expect(
            screen.getByText("Score games in real-time"),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                /An intuitive, touch-first interface designed for mobile/i,
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Live play-by-play tracking"),
        ).toBeInTheDocument();
    });

    it("renders 'Your personal sports journalist' section", () => {
        render(<ShowcaseSection />);
        expect(
            screen.getByText("Your personal sports journalist"),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                /No more boring box scores. Get automatically generated, professional sports columns/i,
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Automated newspaper-style editorial write-ups"),
        ).toBeInTheDocument();
    });

    it("renders 'Advanced batting analytics' section", () => {
        render(<ShowcaseSection />);
        expect(
            screen.getByText("Advanced batting analytics"),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                /Visualize player tendencies with generated spray charts and advanced stats/i,
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Visual spray charts for every player"),
        ).toBeInTheDocument();
    });

    it("renders 'Achievements & awards' section", () => {
        render(<ShowcaseSection />);
        expect(screen.getByText("Achievements & awards")).toBeInTheDocument();
        expect(
            screen.getByText(
                /Track player milestones and celebrate outstanding performances/i,
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "In-game achievements with color-coded rarity tiers",
            ),
        ).toBeInTheDocument();
    });
});
