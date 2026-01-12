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

    // Hits / Error / Fielder's Choice: Allow Batter advancement
    const isOnBase = ["1B", "2B", "3B", "E", "FC"].includes(actionType);
    if (isOnBase) {
        const options = [];
        if (["1B", "E", "FC"].includes(actionType)) {
            options.push({ label: "1st", value: "first" });
            options.push({ label: "2nd", value: "second" });
            options.push({ label: "3rd", value: "third" });
        } else if (actionType === "2B") {
            options.push({ label: "2nd", value: "second" });
            options.push({ label: "3rd", value: "third" });
        } else if (actionType === "3B") {
            options.push({ label: "3rd", value: "third" });
        }

        configs.push({
            base: "batter",
            label: "Batter",
            options,
            shouldShow: true,
            hideStay: true,
        });
    }
    return configs;
}
