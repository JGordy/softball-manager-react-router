export function getMenuTarget(
    menuId,
    itemKey,
    fallbackSelector = '[data-testid="menu-target-icon"]',
) {
    if (typeof document === "undefined") return fallbackSelector;
    const selector = `.tour-${menuId}-item-${itemKey}`;
    const el = document.querySelector(selector);
    if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
        return el;
    }
    return document.querySelector(fallbackSelector) || "body";
}

export function getOpponentScoringSteps(startingMode) {
    const welcomeStep = {
        target: "body",
        placement: "center",
        content:
            "Welcome to Opponent Scoring! Since you won't have the opponent's roster pre-filled, this guide will show you how to log their plays, manage active batters, and record notes on the fly.",
        skipBeacon: true,
        locale: {
            next: "Start Tour",
            skip: "Skip",
        },
    };

    const notesStep = {
        target: ".tour-current-batter-card",
        content:
            "Use this notes field to quickly jot down identifiers like jersey numbers, physical descriptions, or batting stance (lefty/righty) so you can track opponent players easily.",
        placement: "bottom",
        skipScroll: true,
    };

    const firstMenuStep = {
        target: '[data-testid="menu-target-icon"]',
        content:
            "Click here to access options and scoring controls for both the game and the opponent.",
        placement: "bottom",
        skipScroll: true,
    };

    const setActiveBatterStep = {
        target: () => getMenuTarget("gameday-menu", "set-active-batter"),
        content:
            "Detailed scoring can occasionally fall out of sync. Use 'Set Active Batter' to manually select which opponent batter is currently at the plate.",
        placement: "left",
        skipScroll: true,
    };

    const wrapLineupStep = {
        target: () => getMenuTarget("gameday-menu", "wrap-lineup"),
        content:
            "Once you've scored the entire opponent lineup, click 'Top of Lineup (Wrap)' to lock the opponent roster size and cycle back to Batter 1.",
        placement: "left",
        skipScroll: true,
    };

    const toggleToBasicStep = {
        target: () => getMenuTarget("gameday-menu", "toggle-scoring-mode"),
        content:
            "If you don't want to track the opponent batter-by-batter, select 'Basic Scoring' to switch to a simplified runs-and-outs mode. We will automatically switch to Basic mode now to show you those controls.",
        placement: "left",
        skipScroll: true,
    };

    const outButtonStep = {
        target: ".tour-fielding-out-btn",
        content:
            "In Basic mode, quickly record an out for the opponent with a single tap.",
        placement: "top",
        skipScroll: true,
    };

    const runButtonStep = {
        target: ".tour-fielding-run-btn",
        content:
            "Record runs scored by the opponent. Use the arrows to adjust the number of runs to log.",
        placement: "top",
        skipScroll: true,
    };

    const skipButtonStep = {
        target: ".tour-fielding-skip-btn",
        content:
            "If you don't want to score the opponent, you can tap here at any time to skip immediately to your team's batting turn. Otherwise, recording three outs will advance the inning automatically.",
        placement: "top",
        skipScroll: true,
    };

    const secondMenuStep = {
        target: '[data-testid="menu-target-icon"]',
        content:
            "Let's open the menu again to switch back to the other scoring mode.",
        placement: "bottom",
        skipScroll: true,
    };

    const toggleToDetailedStep = {
        target: () => getMenuTarget("gameday-menu", "toggle-scoring-mode"),
        content:
            "We will now switch back to Detailed Scoring mode to return to our starting point and complete the guide.",
        placement: "left",
        skipScroll: true,
    };

    if (startingMode === "Basic") {
        return [
            welcomeStep,
            outButtonStep,
            runButtonStep,
            skipButtonStep,
            firstMenuStep,
            toggleToDetailedStep,
            notesStep,
            secondMenuStep,
            setActiveBatterStep,
            wrapLineupStep,
            toggleToBasicStep,
        ];
    }

    // Default to Detailed scoring first
    return [
        welcomeStep,
        notesStep,
        firstMenuStep,
        setActiveBatterStep,
        wrapLineupStep,
        toggleToBasicStep,
        outButtonStep,
        runButtonStep,
        skipButtonStep,
        secondMenuStep,
        toggleToDetailedStep,
    ];
}
