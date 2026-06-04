/**
 * Helper to retrieve the first visible DOM element matching a selector,
 * or return the selector string/fallback.
 *
 * @param {string} selector - The CSS selector to query.
 * @param {string} [fallback] - Fallback to return if no element is found.
 * @returns {HTMLElement|string} The first visible element or fallback.
 */
export function getFirstVisible(selector, fallback = selector) {
    if (typeof document === "undefined") return fallback;
    const elements = document.querySelectorAll(selector);
    const visible = Array.from(elements).find(
        (el) => el.offsetWidth > 0 && el.offsetHeight > 0,
    );
    return visible || fallback;
}

export const creationSteps = [
    {
        target: "#tour-create-lineup-btn",
        content:
            "Welcome to the Lineup builder! Click here to start creating your team's batting order and fielding positions chart.",
        placement: "bottom",
        skipScroll: true,
    },
    {
        target: "#tour-option-scratch",
        content:
            "You can start completely from scratch, selecting and ordering players one by one.",
        placement: "bottom",
        skipScroll: true,
    },
    {
        target: "#tour-option-available",
        content:
            "Or auto-generate a lineup from all team members who marked themselves as available for the event.",
        placement: "bottom",
        skipScroll: true,
    },
    {
        target: "#tour-option-ai",
        content:
            "If you have 9 or more available players, let our predictive engine generate an optimized lineup based on historical player performance and preferences.",
        placement: "bottom",
        skipScroll: true,
    },
];

export const gridSteps = [
    {
        target: "#tour-drag-handle-0",
        content:
            "Once players are added, drag them up or down by their handle to change the batting order.",
        placement: "right",
        skipScroll: true,
    },
    {
        target: "#tour-position-select-0",
        content:
            "Select fielding positions for each player, inning by inning. Green items indicate preferred positions, and red items show disliked positions.",
        placement: "left",
        skipScroll: true,
    },
    {
        target: () => getFirstVisible(".tour-validation-menu"),
        content:
            "Check here for validation feedback—like gender ratio rule alerts, duplicate positions within an inning, or unassigned defensive slots.",
        placement: "bottom",
        skipScroll: true,
    },
    {
        target: () => getFirstVisible(".tour-lineup-menu-dropdown"),
        content:
            "Use the actions menu to add players, invite guest players, run the predictive AI generator, or delete the chart entirely.",
        placement: "bottom",
        skipScroll: true,
    },
    {
        target: () => getFirstVisible(".tour-save-btn", "#tour-save-btn"),
        content:
            "When you are ready, click Save to keep your drafts, or Publish to notify your players of the roster changes.",
        placement: "top",
        skipScroll: true,
    },
];
