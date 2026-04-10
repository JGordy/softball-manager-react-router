import { createMemoryRouter, RouterProvider } from "react-router";
import { render, screen } from "@/utils/test-utils";
import AchievementsContainer from "../AchievementsContainer";

const mockUser = { $id: "user1" };
const mockAchievements = [
    {
        $id: "ua1",
        achievementId: "ach1",
        userId: "user1",
        achievement: {
            name: "Multi HR Game",
            description: "Hit 2 HRs",
            rarity: "Gold",
        },
    },
    {
        $id: "ua2",
        achievementId: "ach1",
        userId: "user2",
        achievement: {
            name: "Multi HR Game",
            description: "Hit 2 HRs",
            rarity: "Gold",
        },
    },
];

const renderContainer = (deferredData) => {
    const routes = [
        {
            path: "/",
            element: (
                <AchievementsContainer
                    deferredData={deferredData}
                    user={mockUser}
                />
            ),
        },
    ];

    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    return render(<RouterProvider router={router} />);
};

describe("AchievementsContainer", () => {
    it("renders empty state when no achievements are returned", async () => {
        const deferredData = {
            achievements: Promise.resolve([]),
        };

        renderContainer(deferredData);

        expect(await screen.findByText(/No achievements unlocked in this game/i)).toBeInTheDocument();
    });

    it("renders list of achievements and identifies the current user's achievement", async () => {
        const deferredData = {
            achievements: Promise.resolve(mockAchievements),
        };

        renderContainer(deferredData);

        // Should see the achievement name
        const titles = await screen.findAllByText("Multi HR Game");
        expect(titles).toHaveLength(2);

        // Should see the "YOU" badge for user1's achievement
        expect(screen.getByText("YOU")).toBeInTheDocument();
    });
});
