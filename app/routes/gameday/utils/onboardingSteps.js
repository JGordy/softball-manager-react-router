import { getFirstVisible } from "../../lineup/utils/onboardingSteps";

export const opponentSteps = [
    {
        target: "body",
        placement: "center",
        content:
            "Welcome to Opponent Scoring! Since you won't have the opponent's roster pre-filled, this guide will show you how to log their plays, manage active batters, and record notes on the fly.",
        skipBeacon: true,
        locale: {
            next: "Start Tour",
            skip: "Skip",
        },
    },
    {
        target: ".tour-opponent-notes-input",
        content:
            "When scoring the opponent, you won't have their full roster pre-filled. Use this notes field to quickly jot down clues like lefty/righty, jersey numbers, or player speed.",
        placement: "bottom",
        skipScroll: true,
    },
    {
        target: '[data-testid="menu-target-icon"]',
        content:
            "Click here to access options and scoring controls for both the game and the opponent.",
        placement: "bottom",
        skipScroll: true,
    },
    {
        target: () =>
            getFirstVisible(".tour-gameday-menu-item-toggle-scoring-mode"),
        content:
            "If you don't want to track the opponent batter-by-batter, select 'Basic Scoring' to switch to a simplified runs-and-outs mode.",
        placement: "left",
        skipScroll: true,
    },
    {
        target: () =>
            getFirstVisible(".tour-gameday-menu-item-set-active-batter"),
        content:
            "Detailed scoring can occasionally fall out of sync. Use 'Set Active Batter' to manually select which opponent batter is currently at the plate.",
        placement: "left",
        skipScroll: true,
    },
    {
        target: () => getFirstVisible(".tour-gameday-menu-item-wrap-lineup"),
        content:
            "Once you've scored the entire opponent lineup, click 'Top of Lineup (Wrap)' to lock the opponent roster size and cycle back to Batter 1.",
        placement: "left",
        skipScroll: true,
    },
    {
        target: ".tour-fielding-out-btn",
        content:
            "In Basic mode, quickly record an out for the opponent with a single tap.",
        placement: "top",
        skipScroll: true,
    },
    {
        target: ".tour-fielding-run-btn",
        content:
            "Record runs scored by the opponent. Use the arrows to adjust the number of runs to log.",
        placement: "top",
        skipScroll: true,
    },
    {
        target: ".tour-fielding-skip-btn",
        content:
            "When the half-inning ends, tap here to advance immediately to your team's batting turn.",
        placement: "top",
        skipScroll: true,
    },
];
