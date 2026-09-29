import { render, screen, fireEvent } from "@/utils/test-utils";
import SeasonChartsPanel from "../SeasonChartsPanel";
import { trackEvent } from "@/utils/analytics";

jest.mock("@/utils/analytics", () => ({
    trackEvent: jest.fn(),
}));

// Mock @mantine/carousel to enable testing slide change interactions
jest.mock("@mantine/carousel", () => {
    const React = require("react");
    const Carousel = ({ children, onSlideChange }) => (
        <div data-testid="carousel">
            <button
                type="button"
                data-testid="carousel-slide-trends-btn"
                onClick={() => onSlideChange(1)}
            >
                Slide to Trends
            </button>
            <button
                type="button"
                data-testid="carousel-slide-spray-btn"
                onClick={() => onSlideChange(2)}
            >
                Slide to Spray
            </button>
            {children}
        </div>
    );
    Carousel.Slide = ({ children }) => (
        <div data-testid="carousel-slide">{children}</div>
    );
    return { Carousel };
});

// Mock child components
jest.mock("../SeasonRadarChart", () => ({
    __esModule: true,
    default: ({ seasonId }) => (
        <div data-testid="season-radar-chart" data-season-id={seasonId} />
    ),
}));

jest.mock("../SeasonProgressionChart", () => ({
    __esModule: true,
    default: ({ seasonId }) => (
        <div data-testid="season-progression-chart" data-season-id={seasonId} />
    ),
}));

jest.mock("@/components/ContactSprayChart", () => ({
    __esModule: true,
    default: () => <div data-testid="contact-spray-chart" />,
}));

describe("SeasonChartsPanel", () => {
    const mockSeason = { $id: "season-1", games: [] };
    const mockLogs = [];
    const mockPlayers = [];

    it("renders Performance Radar, Batting Trends, and Contact Spray charts", () => {
        render(
            <SeasonChartsPanel
                season={mockSeason}
                logs={mockLogs}
                players={mockPlayers}
            />,
        );

        expect(
            screen.getAllByTestId("season-radar-chart").length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByTestId("season-progression-chart").length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByTestId("contact-spray-chart").length,
        ).toBeGreaterThan(0);
    });

    it("displays initial active slide header title and badge", () => {
        render(
            <SeasonChartsPanel
                season={mockSeason}
                logs={mockLogs}
                players={mockPlayers}
            />,
        );

        expect(
            screen.getByText("Season Performance Radar"),
        ).toBeInTheDocument();
        expect(screen.getByText("1 OF 3")).toBeInTheDocument();
    });

    it("passes seasonId to child chart components", () => {
        render(
            <SeasonChartsPanel
                season={mockSeason}
                logs={mockLogs}
                players={mockPlayers}
            />,
        );

        expect(screen.getByTestId("season-radar-chart")).toHaveAttribute(
            "data-season-id",
            "season-1",
        );
        expect(screen.getByTestId("season-progression-chart")).toHaveAttribute(
            "data-season-id",
            "season-1",
        );
    });

    it("tracks season-charts-slide-view event when sliding through carousel", () => {
        jest.clearAllMocks();
        render(
            <SeasonChartsPanel
                season={mockSeason}
                logs={mockLogs}
                players={mockPlayers}
            />,
        );

        // Slide to trends (index 1)
        fireEvent.click(screen.getByTestId("carousel-slide-trends-btn"));
        expect(trackEvent).toHaveBeenCalledWith("season-charts-slide-view", {
            seasonId: "season-1",
            slideIndex: 1,
            chartName: "trends",
        });
        expect(screen.getByText("Team Batting Trends")).toBeInTheDocument();
        expect(screen.getByText("2 OF 3")).toBeInTheDocument();

        // Slide to spray (index 2)
        fireEvent.click(screen.getByTestId("carousel-slide-spray-btn"));
        expect(trackEvent).toHaveBeenCalledWith("season-charts-slide-view", {
            seasonId: "season-1",
            slideIndex: 2,
            chartName: "spray",
        });
        expect(screen.getByText("Contact Spray Chart")).toBeInTheDocument();
        expect(screen.getByText("3 OF 3")).toBeInTheDocument();
    });
});
