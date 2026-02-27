import { cleanup } from "@testing-library/react";
import { render, screen, act, fireEvent } from "@/utils/test-utils";
import awardsMap from "@/constants/awards";
import images from "@/constants/images";

import PlayerAwards from "../PlayerAwards";

jest.mock("react-router", () => {
    const actual = jest.requireActual("react-router");
    return {
        ...actual,
        useFetcher: jest.fn(),
        useNavigate: jest.fn(),
        Link: ({ children, to, ...props }) => (
            <a href={to} {...props}>
                {children}
            </a>
        ),
    };
});

// Mock DeferredLoader to just call its children immediately with the data
jest.mock("@/components/DeferredLoader", () => ({
    __esModule: true,
    default: ({ resolve, children }) =>
        children(Array.isArray(resolve) ? resolve : []),
}));

// Mock IntersectionObserver for Carousel
global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
};

describe("PlayerAwards Component", () => {
    const awardTypes = Object.keys(awardsMap);
    const mockAwards = [
        {
            $id: "award-1",
            award_type: "mvp",
            decided_at: "2023-10-01T12:00:00Z",
            teams: { name: "Team A", $id: "team-a" },
            seasons: { name: "Fall 2023" },
            game_id: "game-1",
        },
    ];

    const { useFetcher, useNavigate } = require("react-router");

    beforeEach(async () => {
        useFetcher.mockReturnValue({
            state: "idle",
            data: {
                games: [{ $id: "game-1", teamId: "team-a" }],
                logs: [{ gameId: "game-1", playerId: "player1" }],
                teams: [{ $id: "team-a", name: "Team A" }],
            },
            load: jest.fn(),
        });
        useNavigate.mockReturnValue(jest.fn());

        await act(async () => {
            render(
                <PlayerAwards awardsPromise={mockAwards} playerId="player1" />,
            );
        });
    });

    it("renders carousel with all award images and descriptions", async () => {
        // Assert that every award image is rendered in the carousel
        const allImages = screen.getAllByRole("img");
        expect(allImages.length).toBe(awardTypes.length);

        awardTypes.forEach((type) => {
            const awardImage = allImages.find((img) =>
                img.src.includes(images[type]),
            );
            expect(awardImage).toBeDefined();

            // We can verify that all descriptions are accessible via the map
            expect(awardsMap[type].description).toBeDefined();
        });

        // The component renders the description of the active award.
        const mvpDesc = awardsMap.mvp.description;
        expect(screen.getAllByText(mvpDesc).length).toBeGreaterThan(0);
    });

    it("opens StatsDetailDrawer on award click when stats are available", async () => {
        const awardDate = screen.getAllByText("Oct 1, 2023")[0]; // formatted date
        expect(awardDate).toBeInTheDocument();

        fireEvent.click(awardDate);

        // StatsDetailDrawer should render with team name based on mocked fetcher data
        expect(screen.getByText("Team A vs Opponent")).toBeInTheDocument();
    });

    it("navigates to event directly if stats data is missing", async () => {
        cleanup(); // Remove the instance rendered in beforeEach

        useFetcher.mockReturnValue({
            state: "idle",
            data: null,
            load: jest.fn(),
        });
        const navigateMock = jest.fn();
        useNavigate.mockReturnValue(navigateMock);

        // Render freshly with null data
        await act(async () => {
            render(
                <PlayerAwards awardsPromise={mockAwards} playerId="player1" />,
            );
        });

        const awardDate = screen.getAllByText("Oct 1, 2023")[0];

        fireEvent.click(awardDate);

        expect(navigateMock).toHaveBeenCalledWith("/events/game-1?open=awards");
    });
});
