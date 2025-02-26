import { ID } from '@/appwrite';
import { createDocument, updateDocument } from '@/utils/databases.js';

import { combineDateTime } from '@/utils/dateTime';

export async function createPlayer({ values, teamId }) {
    try {
        const userId = ID.unique(); // Create this now so it's easier to use later

        const player = await createDocument(
            'users', // Your users collection ID
            userId, // Generates a unique user ID in the handler
            {
                ...values,
                preferredPositions: values.preferredPositions.split(","), // Split into an array of positions
                dislikedPositions: values.dislikedPositions.split(","), // Split into an array of positions
                userId,
            },
        );

        // Create document in relationship table for the user and team id's.
        await createDocument('memberships', null, { userId, teamId, role: 'player' });

        return { response: { player }, status: 201, success: true };
    } catch (error) {
        console.error("Error creating player:", error);
        throw error;
    }
}

export async function createSeason({ values, teamId }) {
    try {
        const seasonId = ID.unique(); // Create this now so it's easier to use later

        const season = await createDocument(
            'seasons', // Your users collection ID
            seasonId, // Generates a unique user ID in the handler
            {
                ...values,
                gameDays: values.gameDays.split(","), // Split into an array of positions
                signUpFee: Number(values.signUpFee),
                teamId,
                teams: [teamId],
            },
        );

        return { response: { season }, status: 201, success: true };
    } catch (error) {
        console.error("Error creating season:", error);
        throw error;
    }
}

export async function createSingleGame({ values }) {
    const { gameDate, gameTime, isHomeGame, ...gameData } = values;

    try {
        const updatedGameDate = combineDateTime(gameDate, gameTime);

        const updatedGameData = {
            ...gameData,
            isHomeGame: isHomeGame === 'true',
            gameDate: updatedGameDate,
            seasons: values.seasonId,
        };

        const createdGame = await createDocument('games', ID.unique(), updatedGameData);

        return { response: { game: createdGame }, status: 201, success: true };
    } catch (error) {
        console.error("Error creating game:", error);
        throw error;
    }
}

export async function updateTeam({ values, teamId }) {
    // Removes undefined or empty string values from data to update
    const dataToUpdate = {};
    for (const key in values) {
        if (values.hasOwnProperty(key) && values[key] !== undefined && values[key] !== "") {
            dataToUpdate[key] = values[key];
        }
    }

    try {
        const teamDetails = await updateDocument('teams', teamId, dataToUpdate);

        return { response: { teamDetails }, status: 204, success: true }
    } catch (error) {
        console.error("Error updating team:", error);
        throw error;
    }
}