import { SchemaType } from "@google/generative-ai";

const schema = {
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            id: {
                type: SchemaType.STRING,
            },
            firstName: {
                type: SchemaType.STRING,
            },
            lastName: {
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
            "firstName",
            "lastName",
            "gender",
            "battingRating",
            "fieldRating",
            "preferredPositions",
            "positions"
        ]
    }
};

export default schema;
