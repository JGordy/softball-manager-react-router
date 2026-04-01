import { ID, Permission, Role } from "node-appwrite";
import { createDocument, updateDocument } from "@/utils/databases.js";

import { hasBadWords } from "@/utils/badWordsApi";

export async function validatePlayerNames({ firstName, lastName }) {
    if (firstName && (await hasBadWords(firstName))) {
        return {
            response: { error: "First name contains inappropriate language." },
            status: 400,
            success: false,
        };
    }
    if (lastName && (await hasBadWords(lastName))) {
        return {
            response: { error: "Last name contains inappropriate language." },
            status: 400,
            success: false,
        };
    }
    return null;
}

export async function createTemporaryPlayer({ values, eventId, client }) {
    try {
        const nameError = await validatePlayerNames(values);
        if (nameError) return nameError;

        const { teamId, eventId: _eventId, ...playerData } = values;
        const _userId = ID.unique();

        const docPermissions = teamId
            ? [
                  Permission.read(Role.any()),
                  Permission.update(Role.team(teamId, "manager")),
                  Permission.delete(Role.team(teamId, "manager")),
              ]
            : [];

        const player = await createDocument(
            "users",
            _userId,
            {
                ...playerData,
                userId: _userId,
                isTemporary: true,
                createdForEvent: eventId,
                teamId,
            },
            docPermissions,
            client,
        );

        return { response: { player }, status: 201, success: true };
    } catch (error) {
        console.error("Error creating temporary player:", error);
        throw error;
    }
}

export async function updateTemporaryPlayer({ values, userId, client }) {
    try {
        const nameError = await validatePlayerNames(values);
        if (nameError) return nameError;

        const { firstName, lastName, gender } = values;

        const player = await updateDocument(
            "users",
            userId,
            {
                firstName,
                lastName,
                gender,
            },
            client,
        );

        return { response: { player }, status: 200, success: true };
    } catch (error) {
        console.error("Error updating temporary player:", error);
        throw error;
    }
}
