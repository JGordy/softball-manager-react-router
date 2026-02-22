import { render, screen } from "@/utils/test-utils";
import { FeaturePopularity } from "../FeaturePopularity";

describe("FeaturePopularity", () => {
    const mockFeatures = [
        { name: "Live Scoring", views: 200 },
        { name: "Lineups", views: 100 },
        { name: "Player Stats", views: 50 },
    ];

    it("renders features and their view counts", () => {
        render(<FeaturePopularity topFeatures={mockFeatures} />);

        expect(screen.getByText(/Feature Popularity/i)).toBeInTheDocument();
        expect(screen.getByText("Live Scoring")).toBeInTheDocument();
        expect(screen.getByText(/200/)).toBeInTheDocument();
        expect(screen.getByText("Lineups")).toBeInTheDocument();
        expect(screen.getByText(/100/)).toBeInTheDocument();
    });

    it("returns null if no features are provided", () => {
        render(<FeaturePopularity topFeatures={[]} />);
        expect(
            screen.queryByText(/Feature Popularity/i),
        ).not.toBeInTheDocument();
    });

    it("returns null if topFeatures is missing", () => {
        render(<FeaturePopularity topFeatures={null} />);
        expect(
            screen.queryByText(/Feature Popularity/i),
        ).not.toBeInTheDocument();
    });
});
