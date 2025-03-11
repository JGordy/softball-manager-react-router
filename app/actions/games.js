import { ID } from '@/appwrite';
import { createDocument, updateDocument } from '@/utils/databases.js';
import { combineDateTime } from '@/utils/dateTime';

import { removeEmptyValues } from './utils/formUtils';

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

export async function createGames({ values }) {
    const { games: generatedGames, timeZone } = values;
    let games = JSON.parse(generatedGames);

    try {
        const createdGames = [];

        for (const game of games) {
            const createdGame = await createDocument('games', ID.unique(), { ...game, timeZone });
            createdGames.push(createdGame);
        }

        return { response: { games: createdGames }, status: 201, success: true };
    } catch (error) {
        console.error("Error creating games:", error);
        throw error;
    }
}

export async function updateGame({ values, eventId }) {
    // Removes undefined or empty string values from data to update
    let dataToUpdate = removeEmptyValues({ values });

    if (values.gameDate && values.gameTime) {
        dataToUpdate.gameDate = combineDateTime(values.gameDate, values.gameTime);
    }

    if (values.isHomeGame) {
        dataToUpdate.isHomeGame = values.isHomeGame === 'true';
    }

    delete dataToUpdate.gameTime;

    try {
        const gameDetails = await updateDocument('games', eventId, dataToUpdate);

        return { response: { gameDetails }, status: 204, success: true };
    } catch (error) {
        console.error("Error updating game:", error);
        throw error;
    }
}