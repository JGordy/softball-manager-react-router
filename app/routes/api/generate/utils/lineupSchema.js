const Type = {
    OBJECT: "OBJECT",
    ARRAY: "ARRAY",
    STRING: "STRING",
};

/**
 * Schema for AI-generated lineup response
 * This schema defines the structure that includes:
 * - Lineup: Array of players in batting order with fielding positions
 * - Reasoning: Explanation for why this lineup was chosen
 */
const lineupSchema = {
    type: Type.OBJECT,
    description: "Generated lineup with reasoning",
    properties: {
        lineup: {
            type: Type.ARRAY,
            description:
                "Array of players in batting order with fielding positions for each inning",
            items: {
                type: Type.OBJECT,
                description:
                    "Player with their fielding positions for each inning",
                properties: {
                    $id: {
                        type: Type.STRING,
                        description: "Unique player ID from the database",
                        nullable: false,
                    },
                    firstName: {
                        type: Type.STRING,
                        description: "Player's first name",
                        nullable: false,
                    },
                    lastName: {
                        type: Type.STRING,
                        description: "Player's last name",
                        nullable: false,
                    },
                    gender: {
                        type: Type.STRING,
                        description: "Player's gender (male or female)",
                        nullable: false,
                    },
                    bats: {
                        type: Type.STRING,
                        description:
                            "Player's batting side (Right, Left, or Switch)",
                        nullable: true,
                    },
                    positions: {
                        type: Type.ARRAY,
                        description:
                            "Array of fielding positions for each inning (7 innings). Use 'Out' if player is not fielding",
                        items: {
                            type: Type.STRING,
                            description:
                                "Fielding position name or 'Out' if not fielding this inning",
                        },
                        nullable: false,
                    },
                },
                required: [
                    "$id",
                    "firstName",
                    "lastName",
                    "gender",
                    "positions",
                ],
            },
            nullable: false,
        },
        reasoning: {
            type: Type.STRING,
            description:
                "Detailed explanation of why this batting order was chosen based on historical performance patterns. Include specific insights from the data analysis.",
            nullable: false,
        },
    },
    required: ["lineup", "reasoning"],
};

export default lineupSchema;
