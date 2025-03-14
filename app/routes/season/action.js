import { ID } from '@/appwrite';
import { createDocument, updateDocument } from '@/utils/databases';
import { combineDateTime } from '@/utils/dateTime';

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

export async function updateSeason({ values, seasonId }) {
    // Removes undefined or empty string values from data to update
    let dataToUpdate = {};
    for (const key in values) {
        if (values.hasOwnProperty(key) && values[key] !== undefined && values[key] !== "") {
            dataToUpdate[key] = values[key];
        }
    }

    if (dataToUpdate.gameDays) dataToUpdate.gameDays = dataToUpdate.gameDays.split(",");
    if (dataToUpdate.signUpFee) dataToUpdate.signUpFee = Number(dataToUpdate.signUpFee);

    try {
        const seasonDetails = await updateDocument('seasons', seasonId, dataToUpdate);

        return { response: { seasonDetails }, status: 204, success: true };
    } catch (error) {
        console.error("Error updating season:", error);
        throw error;
    }
}