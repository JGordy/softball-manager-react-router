/**
 * Onboarding steps configuration for the Team Details page tour.
 *
 * @returns {Array<Object>} Active React Joyride step objects.
 */
export function getTeamDetailsSteps() {
    return [
        {
            target: ".tour-team-title",
            content:
                "Welcome to your Team Details page! Here you can manage and view your team's roster, seasons overview, recent results, and upcoming games.",
            skipBeacon: true,
            locale: {
                next: "Start Tour",
                skip: "Skip",
            },
        },
        {
            target: ".tour-team-menu",
            content:
                "As a team manager, you have access to the Team Options menu. Let's look inside at the actions you can take.",
        },
        {
            target: ".tour-team-details-menu-section-team-options",
            content:
                "Under Team Options, you can edit the team's league name or visual branding, register new seasons, and schedule upcoming games.",
            placement: "left",
        },
        {
            target: ".tour-team-details-menu-section-roster",
            content:
                "The Roster section is vital for organization: 'Set Lineups' directs you to set the ideal batting order and defensive positioning; 'Invite Players' sends email onboarding invites; 'Assign Numbers' lets you bulk-manage jersey numbers.",
            placement: "left",
        },
        {
            target: ".tour-roster-section-desktop",
            content:
                "This is your team roster. You can view all players, their primary/secondary positions, jersey numbers, and stats.",
            responsive: "desktop",
        },
        {
            target: ".tour-seasons-overview",
            content:
                "This is the Seasons Overview. From here, you can track active and past seasons, overview played games, and drill into specific season stats.",
            responsive: "desktop",
        },
        {
            target: ".tour-mobile-tabs",
            content:
                "Use these mobile tabs to quickly switch between the team roster, active seasons, and scheduled games.",
            responsive: "mobile",
        },
    ];
}
