import { render, screen } from "@/utils/test-utils";

import FeaturesSection from "../components/FeaturesSection";

describe("FeaturesSection", () => {
    beforeEach(() => {
        render(<FeaturesSection />);
    });

    it("renders AI-Powered Game Recaps feature", () => {
        expect(screen.getByText("AI-Powered Game Recaps")).toBeInTheDocument();
        expect(
            screen.getByText(
                /Receive automatically generated, newspaper-style editorial game summaries instantly after the final out/i,
            ),
        ).toBeInTheDocument();
    });

    it("renders AI Powered Lineups feature", () => {
        expect(screen.getByText("AI Powered Lineups")).toBeInTheDocument();
        expect(
            screen.getByText(
                /Generate the best lineup available using in-depth game and individual player history/i,
            ),
        ).toBeInTheDocument();
    });

    it("renders Dynamic Game Scoring feature", () => {
        expect(screen.getByText("Dynamic Game Scoring")).toBeInTheDocument();
        expect(
            screen.getByText(
                /Intuitive scoring interface that updates player stats and team analytics in real-time/i,
            ),
        ).toBeInTheDocument();
    });

    it("renders Team Management feature", () => {
        expect(screen.getByText("Team Management")).toBeInTheDocument();
        expect(
            screen.getByText(/Centralize your roster and player details/i),
        ).toBeInTheDocument();
    });

    it("renders Season Schedules feature", () => {
        expect(screen.getByText("Season Schedules")).toBeInTheDocument();
        expect(
            screen.getByText(/Keep track of games and locations easily/i),
        ).toBeInTheDocument();
    });

    it("renders Attendance Tracking feature", () => {
        expect(screen.getByText("Attendance Tracking")).toBeInTheDocument();
        expect(
            screen.getByText(/Know who is showing up before game day/i),
        ).toBeInTheDocument();
    });

    it("renders Player Analytics feature", () => {
        expect(screen.getByText("Player Analytics")).toBeInTheDocument();
        expect(
            screen.getByText(
                /Visualize player performance with deep statistical insights/i,
            ),
        ).toBeInTheDocument();
    });

    it("renders Game Awards & Voting feature", () => {
        expect(screen.getByText("Game Awards & Voting")).toBeInTheDocument();
        expect(
            screen.getByText(
                /Keep the friendly rivalry alive with peer-voted MVPs and superlatives/i,
            ),
        ).toBeInTheDocument();
    });

    it("renders In-Game Achievements feature", () => {
        expect(screen.getByText("In-Game Achievements")).toBeInTheDocument();
        expect(
            screen.getByText(
                /Unlock unique milestone awards and track rarity tiers on your player profile/i,
            ),
        ).toBeInTheDocument();
    });

    it("renders Push Notifications feature", () => {
        expect(screen.getByText("Push Notifications")).toBeInTheDocument();
        expect(
            screen.getByText(
                /Receive instant mobile alerts for RSVP requests, schedule changes, and real-time game updates/i,
            ),
        ).toBeInTheDocument();
    });
});
