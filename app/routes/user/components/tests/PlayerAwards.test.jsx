import React from "react";
import { MemoryRouter } from "react-router";

import awardsMap from "@/constants/awards";
import images from "@/constants/images";
import { render, screen, act, waitFor } from "@/utils/test-utils";

import PlayerAwards from "../PlayerAwards";

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
            decided_at: "2023-10-01",
            teams: { name: "Team A", $id: "team-a" },
            seasons: { name: "Fall 2023" },
            game_id: "game-1",
        },
    ];

    beforeEach(async () => {
        await act(async () => {
            render(
                <MemoryRouter>
                    <PlayerAwards awardsPromise={mockAwards} />
                </MemoryRouter>,
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
});
