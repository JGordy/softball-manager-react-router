import { render, screen } from "@/utils/test-utils";

import ShowcaseSection from "../components/ShowcaseSection";

describe("ShowcaseSection", () => {
    // Suppress expected console errors from image key collisions in test environment
    beforeAll(() => {
        jest.spyOn(console, "error").mockImplementation((msg) => {
            if (msg.includes("Encountered two children with the same key"))
                return;
            // eslint-disable-next-line no-console
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

    it("renders 'Celebrate team heroes' section", () => {
        render(<ShowcaseSection />);
        expect(screen.getByText("Celebrate team heroes")).toBeInTheDocument();
        expect(
            screen.getByText(
                /Recognize outstanding performances with post-game awards/i,
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Post-game voting for MVP & accolades"),
        ).toBeInTheDocument();
    });
});
