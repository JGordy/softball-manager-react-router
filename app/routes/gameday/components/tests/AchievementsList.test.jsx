import { render, screen } from "@/utils/test-utils";
import AchievementsList from "../AchievementsList";

describe("AchievementsList", () => {
    const mockPlayers = [
        { $id: "p1", firstName: "Alice", lastName: "Smith" },
        { $id: "p2", firstName: "Bob", lastName: "Johnson" },
    ];

    const mockAchievements = [
        {
            $id: "ua1",
            userId: "p1",
            $createdAt: "2024-01-01T12:00:00Z",
            achievement: {
                name: "Power Hitter",
                rarity: "epic",
                description: "Hit a HR",
            },
        },
    ];

    it("renders empty state when no achievements are provided", () => {
        render(<AchievementsList achievements={[]} players={mockPlayers} />);
        expect(
            screen.getByText(/No achievements earned yet/i),
        ).toBeInTheDocument();
        expect(screen.getByText(/Game Achievements/i)).toBeInTheDocument();
    });

    it("renders achievement cards with correctly formatted player names", () => {
        render(
            <AchievementsList
                achievements={mockAchievements}
                players={mockPlayers}
            />,
        );
        expect(screen.getByText("Power Hitter")).toBeInTheDocument();
        expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });

    it("renders 'YOU' for achievements belonging to the current user", () => {
        const user = { $id: "p1" };
        render(
            <AchievementsList
                achievements={mockAchievements}
                players={mockPlayers}
                user={user}
            />,
        );
        expect(screen.getByText("YOU")).toBeInTheDocument();
        expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
    });

    it("filters out invalid achievements (missing achievement data)", () => {
        const invalidAchievements = [
            { $id: "ua2", userId: "p1", $createdAt: "2024-01-02T12:00:00Z" }, // No achievement prop
        ];
        render(
            <AchievementsList
                achievements={invalidAchievements}
                players={mockPlayers}
            />,
        );
        expect(
            screen.getByText(/No achievements earned yet/i),
        ).toBeInTheDocument();
    });
});
