export function getMenuTarget(menuId, itemKey) {
    return `.tour-${menuId}-item-${itemKey}`;
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
        target: ".tour-gameday-menu-target",
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

    // First transition when starting on Detailed (switches to Basic)
    const toggleToBasicFirst = {
        target: () => getMenuTarget("gameday-menu", "toggle-scoring-mode"),
        content:
            "If you don't want to track the opponent batter-by-batter, select 'Basic Scoring' to switch to a simplified runs-and-outs mode. We will automatically switch to Basic mode now to show you those controls.",
        placement: "left",
        skipScroll: true,
    };

    // Second transition when starting on Basic (switches back to Basic)
    const toggleToBasicSecond = {
        target: () => getMenuTarget("gameday-menu", "toggle-scoring-mode"),
        content:
            "We will now switch back to Basic Scoring mode to return to our starting point and complete the guide.",
        placement: "left",
        skipScroll: true,
    };

    const outButtonStep = {
        target: ".tour-fielding-out-btn",
        content:
            "In Basic mode, quickly record an out for the opponent with a single tap. Recording three outs will automatically advance to the next half-inning.",
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
            "If you don't want to score the opponent, you can tap here at any time to skip immediately to your team's batting turn.",
        placement: "top",
        skipScroll: true,
    };

    const secondMenuStep = {
        target: ".tour-gameday-menu-target",
        content:
            "Let's open the menu again to switch back to the other scoring mode.",
        placement: "bottom",
        skipScroll: true,
    };

    // First transition when starting on Basic (switches to Detailed)
    const toggleToDetailedFirst = {
        target: () => getMenuTarget("gameday-menu", "toggle-scoring-mode"),
        content:
            "If you want to track physical descriptions and score plays batter-by-batter, select 'Detailed Scoring'. We will automatically switch to Detailed mode now to show you those features.",
        placement: "left",
        skipScroll: true,
    };

    // Second transition when starting on Detailed (switches back to Detailed)
    const toggleToDetailedSecond = {
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
            toggleToDetailedFirst,
            notesStep,
            secondMenuStep,
            setActiveBatterStep,
            wrapLineupStep,
            toggleToBasicSecond,
        ];
    }

    // Default to Detailed scoring first
    return [
        welcomeStep,
        notesStep,
        firstMenuStep,
        setActiveBatterStep,
        wrapLineupStep,
        toggleToBasicFirst,
        outButtonStep,
        runButtonStep,
        skipButtonStep,
        secondMenuStep,
        toggleToDetailedSecond,
    ];
}

export function getScoringFlowSteps() {
    return [
        {
            target: "body",
            placement: "center",
            content:
                "Welcome to the scoring flow guide! This tour will walk you through scoring an at-bat, selecting hit location, adjusting runners, and confirming or undoing plays.",
            skipBeacon: true,
            locale: {
                next: "Start Tour",
                skip: "Skip",
            },
        },
        {
            target: ".tour-action-1b",
            content:
                "Click on 1B (Single) to record a base hit for the current batter.",
            placement: "top",
            skipScroll: true,
        },
        {
            target: ".tour-spray-field",
            content:
                "Now select where the ball was hit. You can click on any fielding position or touch and drag on the field. For this tour, we will automatically click RF (Right Field) for you.",
            placement: "top",
            skipScroll: true,
        },
        {
            target: ".tour-runner-advancement-dnd",
            content:
                "Review and adjust runner advancements. If a runner got out, drag their badge to the OUT circle. Drag base runners clockwise to advance them.",
            placement: "top",
            skipScroll: true,
        },
        {
            target: ".tour-confirm-play-btn",
            content:
                "Click 'Confirm Play' to save the play. We will click it now to log the hit.",
            placement: "top",
            skipScroll: true,
        },
        {
            target: ".tour-last-play-card",
            content:
                "If you made a mistake, you can click UNDO on the Last Play card. We will undo the play now to reset the field.",
            placement: "top",
            skipScroll: true,
        },
    ];
}
