import { render, screen, fireEvent } from "@/utils/test-utils";
import SeasonChartsPanel from "../SeasonChartsPanel";

// Mock child components
jest.mock("../SeasonRadarChart", () => ({
    __esModule: true,
    default: () => <div data-testid="season-radar-chart" />,
}));

jest.mock("@/components/ContactSprayChart", () => ({
    __esModule: true,
    default: () => <div data-testid="contact-spray-chart" />,
}));

describe("SeasonChartsPanel", () => {
    const mockSeason = { $id: "season-1", games: [] };
    const mockLogs = [];
    const mockPlayers = [];

    it("renders both Performance Radar and Contact Spray charts", () => {
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
        expect(screen.getByText("1 OF 2")).toBeInTheDocument();
    });
});
