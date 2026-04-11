import { createMemoryRouter, RouterProvider } from "react-router";
import { render, screen, fireEvent } from "@/utils/test-utils";
import PlayerAchievements from "../PlayerAchievements";

const mockAchievements = [
    {
        $id: "ua1",
        achievementId: "ach1",
        $createdAt: "2024-01-01T10:00:00Z",
        achievement: {
            name: "Multi HR Game",
            description: "Hit 2 HRs",
            rarity: "Legendary",
        },
    },
    {
        $id: "ua2",
        achievementId: "ach2",
        $createdAt: "2024-01-02T10:00:00Z",
        achievement: {
            name: "RBI King",
            description: "Load of RBIs",
            rarity: "Rare",
        },
    },
];

const renderComponent = (promise) => {
    const routes = [
        {
            path: "/",
            element: (
                <PlayerAchievements achievementsPromise={promise} />
            ),
        },
    ];

    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    return render(<RouterProvider router={router} />);
};

describe("PlayerAchievements", () => {
    it("renders empty state correctly", async () => {
        const promise = Promise.resolve([]);
        renderComponent(promise);

        expect(await screen.findByText(/No Achievements Yet/i)).toBeInTheDocument();
        expect(screen.getByText(/Keep playing to unlock achievements/i)).toBeInTheDocument();
    });

    it("renders achievement dashboard and list correctly", async () => {
        const promise = Promise.resolve(mockAchievements);
        renderComponent(promise);

        // Dashboard Stats
        expect(await screen.findByTestId("rarity-filter-all")).toBeInTheDocument();
        expect(screen.getByTestId("rarity-filter-legendary")).toBeInTheDocument();
        expect(screen.getByTestId("rarity-filter-rare")).toBeInTheDocument();

        // Initial list
        expect(screen.getByText("Multi HR Game")).toBeInTheDocument();
        expect(screen.getByText("RBI King")).toBeInTheDocument();

        // Date check (split nodes)
        expect(screen.getAllByText("Unlocked")).toHaveLength(2);
        expect(screen.getByText("Jan 01, 2024")).toBeInTheDocument();
    });

    it("filters the list when a rarity card is clicked", async () => {
        const promise = Promise.resolve(mockAchievements);
        renderComponent(promise);

        // Wait for load
        await screen.findByText("Multi HR Game");

        // Click Legendary filter
        const legendaryCard = screen.getByTestId("rarity-filter-legendary");
        fireEvent.click(legendaryCard);

        // Legendary achievement should still be there
        expect(screen.getByText("Multi HR Game")).toBeInTheDocument();

        // Rare achievement should be filtered out
        expect(screen.queryByText("RBI King")).not.toBeInTheDocument();

        // Click All to reset
        const allCard = screen.getByTestId("rarity-filter-all");
        fireEvent.click(allCard);
        expect(screen.getByText("RBI King")).toBeInTheDocument();
    });
});
