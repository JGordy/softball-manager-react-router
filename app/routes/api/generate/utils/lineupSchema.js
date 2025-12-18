import { SchemaType } from "@google/generative-ai";

/**
 * Schema for AI-generated lineup response
 * This schema defines the structure that includes:
 * - Lineup: Array of players in batting order with fielding positions
 * - Reasoning: Explanation for why this lineup was chosen
 */
const lineupSchema = {
    type: SchemaType.OBJECT,
    description: "Generated lineup with reasoning",
    properties: {
        lineup: {
            type: SchemaType.ARRAY,
            description:
                "Array of players in batting order with fielding positions for each inning",
            items: {
                type: SchemaType.OBJECT,
                description:
                    "Player with their fielding positions for each inning",
                properties: {
                    $id: {
                        type: SchemaType.STRING,
                        description: "Unique player ID from the database",
                        nullable: false,
                    },
                    firstName: {
                        type: SchemaType.STRING,
                        description: "Player's first name",
                        nullable: false,
                    },
                    lastName: {
                        type: SchemaType.STRING,
                        description: "Player's last name",
                        nullable: false,
                    },
                    gender: {
                        type: SchemaType.STRING,
                        description: "Player's gender (male or female)",
                        nullable: false,
                    },
                    positions: {
                        type: SchemaType.ARRAY,
                        description:
                            "Array of fielding positions for each inning (7 innings). Use 'Out' if player is not fielding",
                        items: {
                            type: SchemaType.STRING,
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
            type: SchemaType.STRING,
            description:
                "Detailed explanation of why this batting order was chosen based on historical performance patterns. Include specific insights from the data analysis.",
            nullable: false,
        },
    },
    required: ["lineup", "reasoning"],
};

export default lineupSchema;
