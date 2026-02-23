import { render, screen } from "@/utils/test-utils";
import { AnalyticsSummary } from "../AnalyticsSummary";

describe("AnalyticsSummary", () => {
    const umami = {
        pageviews: { value: 1000 },
        visitors: { value: 250 },
        bounces: { value: 50 },
        totaltime: { value: 3600 },
    };

    it("renders umami metrics correctly", () => {
        render(<AnalyticsSummary umami={umami} range="24h" />);

        expect(screen.getByText("Umami Analytics (24h)")).toBeInTheDocument();
        expect(screen.getByText("1,000")).toBeInTheDocument();
        expect(screen.getByText("250")).toBeInTheDocument();
        expect(screen.getByText("60 min")).toBeInTheDocument();
    });

    it("renders correct label for different ranges", () => {
        const { rerender } = render(
            <AnalyticsSummary umami={umami} range="7d" />,
        );
        expect(screen.getByText("Umami Analytics (7d)")).toBeInTheDocument();

        rerender(<AnalyticsSummary umami={umami} range="30d" />);
        expect(screen.getByText("Umami Analytics (30d)")).toBeInTheDocument();
    });

    it("renders error message if umami data is missing", () => {
        render(<AnalyticsSummary umami={null} range="24h" />);

        expect(
            screen.getByText("Failed to load Umami data"),
        ).toBeInTheDocument();
    });

    it("handles legacy value format (non-object values)", () => {
        const legacyUmami = {
            pageviews: 500,
            visitors: 100,
            bounces: 25,
            totaltime: 120,
        };
        render(<AnalyticsSummary umami={legacyUmami} range="24h" />);

        expect(screen.getByText("500")).toBeInTheDocument();
        expect(screen.getByText("100")).toBeInTheDocument();
        expect(screen.getByText("2 min")).toBeInTheDocument();
    });
});
