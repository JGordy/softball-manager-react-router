import { render, screen } from "@/utils/test-utils";
import AchievementCard from "../AchievementCard";

const mockAchievement = {
    name: "Multi HR Game",
    description: "Hit 2 or more home runs in a single game.",
    rarity: "legendary",
    icon: "trophy",
};

describe("AchievementCard", () => {
    it("renders unlocked achievement details correctly", () => {
        render(
            <AchievementCard
                achievement={mockAchievement}
                unlockedAt="2024-01-01T10:00:00Z"
            />,
        );

        expect(screen.getByText("Multi HR Game")).toBeInTheDocument();
        expect(
            screen.getByText("Hit 2 or more home runs in a single game."),
        ).toBeInTheDocument();
        expect(screen.getByText("Unlocked")).toBeInTheDocument();
        expect(screen.getByText("Jan 01, 2024")).toBeInTheDocument();
    });

    it("renders legendary styling correctly", () => {
        const legendary = { ...mockAchievement, rarity: "Legendary" };
        render(
            <AchievementCard
                achievement={legendary}
                unlockedAt="2024-01-01T10:00:00Z"
            />,
        );

        expect(screen.getByTestId("achievement-card")).toHaveStyle(
            "--rarity-color: #FFD700",
        );
        expect(
            screen.getByTestId("achievement-rarity-badge"),
        ).toHaveTextContent(/Legendary/i);
    });

    it("renders epic styling correctly", () => {
        const epic = { ...mockAchievement, rarity: "Epic" };
        render(
            <AchievementCard
                achievement={epic}
                unlockedAt="2024-01-01T10:00:00Z"
            />,
        );

        expect(screen.getByTestId("achievement-card")).toHaveStyle(
            "--rarity-color: #9C27B0",
        );
        expect(
            screen.getByTestId("achievement-rarity-badge"),
        ).toHaveTextContent(/Epic/i);
    });

    it("renders rare styling correctly", () => {
        const rare = { ...mockAchievement, rarity: "Rare" };
        render(
            <AchievementCard
                achievement={rare}
                unlockedAt="2024-01-01T10:00:00Z"
            />,
        );

        expect(screen.getByTestId("achievement-card")).toHaveStyle(
            "--rarity-color: #2196F3",
        );
        expect(
            screen.getByTestId("achievement-rarity-badge"),
        ).toHaveTextContent(/Rare/i);
    });

    it("renders uncommon styling correctly", () => {
        const uncommon = { ...mockAchievement, rarity: "Uncommon" };
        render(
            <AchievementCard
                achievement={uncommon}
                unlockedAt="2024-01-01T10:00:00Z"
            />,
        );

        expect(screen.getByTestId("achievement-card")).toHaveStyle(
            "--rarity-color: #4CAF50",
        );
        expect(
            screen.getByTestId("achievement-rarity-badge"),
        ).toHaveTextContent(/Uncommon/i);
    });

    it("renders common styling correctly", () => {
        const common = { ...mockAchievement, rarity: "Common" };
        render(
            <AchievementCard
                achievement={common}
                unlockedAt="2024-01-01T10:00:00Z"
            />,
        );

        expect(screen.getByTestId("achievement-card")).toHaveStyle(
            "--rarity-color: #9E9E9E",
        );
        expect(
            screen.getByTestId("achievement-rarity-badge"),
        ).toHaveTextContent(/Common/i);
    });

    it("renders locked state when isLocked is true", () => {
        render(
            <AchievementCard achievement={mockAchievement} isLocked={true} />,
        );

        expect(screen.getByText("Multi HR Game")).toBeInTheDocument();
        expect(
            screen.getByText(/Keep playing to unlock this achievement/i),
        ).toBeInTheDocument();
    });

    it("displays 'YOU' badge when isMe is true", () => {
        render(
            <AchievementCard
                achievement={mockAchievement}
                unlockedAt="2024-01-01T10:00:00Z"
                isMe={true}
                playerName="YOU"
            />,
        );

        expect(
            screen.getByTestId("achievement-player-badge"),
        ).toHaveTextContent("YOU");
    });
});
