export function getDrawerTitle(actionType, currentBatter) {
    const batterName = currentBatter?.firstName || "Batter";

    switch (actionType) {
        case "1B":
            return `${batterName} singles to...`;
        case "2B":
            return `${batterName} doubles to...`;
        case "3B":
            return `${batterName} triples to...`;
        case "HR":
            return `${batterName} homers to...`;
        case "E":
            return `${batterName} reaches on error by...`;
        case "FC":
            return `${batterName} reaches on FC to...`;
        case "SF":
            return `${batterName} sac flies to...`;
        case "Ground Out":
            return `${batterName} grounds out to...`;
        case "Fly Out":
            return `${batterName} flies out to...`;
        case "Line Out":
            return `${batterName} lines out to...`;
        case "Pop Out":
            return `${batterName} pops out to...`;
        default:
            return `${batterName} - Select Position`;
    }
}

export function getRunnerConfigs(actionType, runners) {
    const configs = [
        {
            base: "third",
            label: "Runner on 3rd",
            options: [],
            shouldShow: runners.third,
        },
        {
            base: "second",
            label: "Runner on 2nd",
            options: [{ label: "3rd", value: "third" }],
            shouldShow: runners.second,
        },
        {
            base: "first",
            label: "Runner on 1st",
            options: [
                { label: "2nd", value: "second" },
                { label: "3rd", value: "third" },
            ],
            shouldShow: runners.first,
        },
    ];

    // Error / Fielder's Choice: Allow Batter advancement
    if (["E", "FC"].includes(actionType)) {
        configs.push({
            base: "batter",
            label: "Batter",
            options: [
                { label: "1st", value: "first" }, // Default
                { label: "2nd", value: "second" },
                { label: "3rd", value: "third" },
            ],
            // Always show for E/FC
            shouldShow: true,
        });
    }
    return configs;
}
