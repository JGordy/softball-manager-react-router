// UI Action Keys (Internal to the scoring logic)
export const UI_KEYS = {
    SINGLE: "1B",
    DOUBLE: "2B",
    TRIPLE: "3B",
    HOMERUN: "HR",
    WALK: "BB",
    STRIKEOUT: "K",
    GROUND_OUT: "Ground Out",
    FLY_OUT: "Fly Out",
    LINE_OUT: "Line Out",
    POP_OUT: "Pop Out",
    ERROR: "E",
    FIELDERS_CHOICE: "FC",
    SACRIFICE_FLY: "SF",
};

// Mapping between UI action types and database eventType values
export const EVENT_TYPE_MAP = {
    [UI_KEYS.SINGLE]: "single",
    [UI_KEYS.DOUBLE]: "double",
    [UI_KEYS.TRIPLE]: "triple",
    [UI_KEYS.HOMERUN]: "homerun",
    [UI_KEYS.WALK]: "walk",
    [UI_KEYS.STRIKEOUT]: "strikeout",
    [UI_KEYS.GROUND_OUT]: "ground_out",
    [UI_KEYS.FLY_OUT]: "fly_out",
    [UI_KEYS.LINE_OUT]: "line_out",
    [UI_KEYS.POP_OUT]: "pop_out",
    [UI_KEYS.ERROR]: "error",
    [UI_KEYS.FIELDERS_CHOICE]: "fielders_choice",
    [UI_KEYS.SACRIFICE_FLY]: "sacrifice_fly",
};

// Helper functions to get UI or DB values by category
export const getUIValues = (category) => {
    const categories = {
        hits: [UI_KEYS.SINGLE, UI_KEYS.DOUBLE, UI_KEYS.TRIPLE, UI_KEYS.HOMERUN],
        walks: [UI_KEYS.WALK],
        battedOuts: [
            UI_KEYS.GROUND_OUT,
            UI_KEYS.FLY_OUT,
            UI_KEYS.LINE_OUT,
            UI_KEYS.POP_OUT,
        ],
    };
    return categories[category] || [];
};

export const getDBValues = (category) => {
    const categories = {
        hits: ["single", "double", "triple", "homerun"],
        walks: ["walk"],
        outs: [
            "out",
            "strikeout",
            "ground_out",
            "fly_out",
            "line_out",
            "pop_out",
        ],
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
