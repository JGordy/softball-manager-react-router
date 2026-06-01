/**
 * Onboarding steps configuration for the Event Details page tour.
 * Separates player steps and manager steps dynamically based on role.
 *
 * @param {boolean} managerView - Whether the current user is a team manager.
 * @returns {Array<Object>} Active React Joyride step objects.
 */
export function getEventDetailsSteps(managerView) {
    return [
        {
            target: "body",
            placement: "center",
            content:
                "Welcome to the Event Details page! Here you can check matchup dates, final scores, and real-time game details.",
            skipBeacon: true,
            locale: {
                next: "Start Tour",
                skip: "Skip",
            },
        },
        {
            target: ".tour-share-game-button",
            content:
                "Tap this Share button to quickly copy the game link to your clipboard or send it directly to players and fans.",
        },
        {
            target: ".tour-interactive-badge-row",
            content:
                "Use this interactive badge row to quickly check weather forecasts, set your availability, add the game to your calendar, or get driving directions directly to the park.",
            responsive: "mobile",
        },
        {
            target: ".tour-gameday-hub-card",
            content:
                "Access live scoring stats, play-by-plays, and box scores to follow the matchup action in real-time.",
            responsive: "mobile",
        },
        {
            target: ".tour-lineup-field-card",
            content:
                "View starting lineups, batting orders, and interactive fielding charts, or tap to open the details.",
            responsive: "mobile",
        },
        ...(managerView
            ? [
                  {
                      target: ".tour-game-menu-trigger",
                      content:
                          "As a team manager, you have access to the Game Options menu to update schedule details or draft charts.",
                      responsive: "mobile",
                  },
                  {
                      target: ".tour-game-details-menu-dropdown",
                      content:
                          "Under this dropdown, you can update dates, edit locations, draft lineups, or cancel/delete the game.",
                      placement: "left",
                  },
              ]
            : []),
    ];
}
