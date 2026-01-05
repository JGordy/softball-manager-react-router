// Mapping between UI action types and database eventType values
export const EVENT_TYPE_MAP = {
    "1B": "single",
    "2B": "double",
    "3B": "triple",
    HR: "homerun",
    BB: "walk",
    K: "out",
    "Ground Out": "out",
    "Fly Out": "out",
    "Line Out": "out",
    "Pop Out": "out",
    E: "error",
    FC: "fielders_choice",
    SF: "sacrifice_fly",
};

// Helper functions to get UI or DB values by category
export const getUIValues = (category) => {
    const categories = {
        hits: ["1B", "2B", "3B", "HR"],
        walks: ["BB"],
        battedOuts: ["Ground Out", "Fly Out", "Line Out", "Pop Out"],
    };
    return categories[category] || [];
};

export const getDBValues = (category) => {
    const categories = {
        hits: ["single", "double", "triple", "homerun"],
        walks: ["walk"],
        outs: ["out"],
        errors: ["error"],
    };
    return categories[category] || [];
};

// Convenience exports for common use cases
export const UI_HITS = getUIValues("hits");
export const UI_WALKS = getUIValues("walks");
export const UI_BATTED_OUTS = getUIValues("battedOuts");

export const HITS = getDBValues("hits");
export const WALKS = getDBValues("walks");
export const OUTS = getDBValues("outs");

// Helper to get UI label from database value
export const getUILabel = (dbValue) => {
    return (
        Object.keys(EVENT_TYPE_MAP).find(
            (key) => EVENT_TYPE_MAP[key] === dbValue,
        ) || dbValue
    );
};
