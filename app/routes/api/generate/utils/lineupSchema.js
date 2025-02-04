import { SchemaType } from "@google/generative-ai";

const schema = {
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            id: {
                type: SchemaType.STRING,
            },
            name: {
                type: SchemaType.STRING,
            },
            gender: {
                type: SchemaType.STRING,
            },
            battingRating: {
                type: SchemaType.INTEGER,
            },
            fieldRating: {
                type: SchemaType.INTEGER,
            },
            preferredPositions: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.STRING,
                }
            },
            positions: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.STRING,
                }
            }
        },
        required: [
            "id",
            "name",
            "gender",
            "battingRating",
            "fieldRating",
            "preferredPositions",
            "positions"
        ]
    }
};

export default schema;
