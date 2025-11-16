import { ID } from "node-appwrite";
import {
    createDocument,
    deleteDocument,
    updateDocument,
} from "@/utils/databases.js";
import { redirect } from "react-router";
import { combineDateTime } from "@/utils/dateTime";
import { hasBadWords } from "@/utils/badWordsApi";

import { removeEmptyValues } from "./utils/formUtils";

function computeResult(score, opponentScore) {
    const a = parseInt(String(score).trim(), 10);
    const b = parseInt(String(opponentScore).trim(), 10);

    if (Number.isNaN(a) || Number.isNaN(b)) return undefined;

    if (a > b) return "won";
    if (a < b) return "lost";
    return "tie";
}

export async function createSingleGame({ values }) {
    const { gameDate, gameTime, isHomeGame, opponent, ...gameData } = values;

    try {
        // Check opponent name for inappropriate language
        if (opponent && (await hasBadWords(opponent))) {
            return {
                success: false,
                status: 400,
                message:
                    "Opponent name contains inappropriate language. Please choose a different name.",
            };
        }
        const updatedGameDate = combineDateTime(
            gameDate,
            gameTime,
            values.timeZone,
        );

        const updatedGameData = {
            ...gameData,
            isHomeGame: isHomeGame === "true",
            gameDate: updatedGameDate,
            seasons: values.seasonId,
        };

        const createdGame = await createDocument(
            "games",
            ID.unique(),
            updatedGameData,
        );

        return {
            response: { game: createdGame },
            status: 201,
            success: true,
            message: "Game created successfully!",
        };
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
            const createdGame = await createDocument("games", ID.unique(), {
                ...game,
                timeZone,
            });
            createdGames.push(createdGame);
        }

        return {
            response: { games: createdGames },
            status: 201,
            success: true,
            message: `${createdGames.length} games created successfully!`,
        };
    } catch (error) {
        console.error("Error creating games:", error);
        throw error;
    }
}

export async function updateGame({ values, eventId }) {
    const { opponent } = values;
    // Removes undefined or empty string values from data to update
    let dataToUpdate = removeEmptyValues({ values });

    if (values.gameDate && values.gameTime) {
        dataToUpdate.gameDate = combineDateTime(
            values.gameDate,
            values.gameTime,
            values.timeZone,
        );
    }

    if (values.isHomeGame) {
        dataToUpdate.isHomeGame = values.isHomeGame === "true";
    }

    // Ensure score and opponentScore are strings that represent valid integers
    ["score", "opponentScore"].forEach((key) => {
        if (dataToUpdate.hasOwnProperty(key)) {
            const value = dataToUpdate[key];

            const trimmedValue = String(value).trim();
            if (/^-?\d+$/.test(trimmedValue)) {
                // Keep as string (Appwrite stores strings in some places) but ensure trimmed
                dataToUpdate[key] = trimmedValue;
            } else {
                delete dataToUpdate[key]; // Delete invalid integer string
            }
        }
    });

    // If both scores are present, compute and set the result
    if (
        dataToUpdate.hasOwnProperty("score") &&
        dataToUpdate.hasOwnProperty("opponentScore")
    ) {
        const result = computeResult(
            dataToUpdate.score,
            dataToUpdate.opponentScore,
        );

        if (result) dataToUpdate.result = result;
    }

    // Normalize countTowardsRecord when provided from the form (checkbox/switch)
    if (Object.prototype.hasOwnProperty.call(values, "countTowardsRecord")) {
        dataToUpdate.countTowardsRecord =
            values.countTowardsRecord === "true" ||
            values.countTowardsRecord === "on" ||
            values.countTowardsRecord === true;
    }

    delete dataToUpdate.gameTime;

    try {
        // Check opponent name for inappropriate language
        if (opponent && (await hasBadWords(opponent))) {
            return {
                success: false,
                status: 400,
                message:
                    "Opponent name contains inappropriate language. Please choose a different name.",
            };
        }

        const gameDetails = await updateDocument(
            "games",
            eventId,
            dataToUpdate,
        );

        return {
            response: { gameDetails },
            status: 204,
            success: true,
            message: "Game updated successfully",
        };
    } catch (error) {
        console.error("Error updating game:", error);
        throw error;
    }
}

export async function deleteGame({ values, eventId }) {
    console.log("deleteGame: ", { eventId, values });
    // TODO: Add permission check here with values.userId
    try {
        await deleteDocument("games", eventId);
        // On success, redirect to the events list page.
        return redirect("/events");
    } catch (error) {
        console.error("Error deleting game:", error);
        throw error;
    }
}

export async function savePlayerChart({ values, eventId }) {
    console.log("savePlayerChart: ", { values, eventId });
    // TODO: Save created lineup to appwrite database
}

export async function generatePlayerChart({ values, eventId }) {
    console.log("generatePlayerChart: ", { values, eventId });
    // TODO: Generate a batting lineup and fielding chart using gen AI
}

// TODO: Remove this function once the Google Forms integration is no longer used
export async function createAttendanceForm({ values, request }) {
    const { team, gameDate, opponent, gameId } = values;

    try {
        const url = new URL(request.url);
        const baseUrl = url.origin;

        const response = await fetch(`${baseUrl}/api/create-attendance`, {
            method: "POST",
            body: JSON.stringify({
                team: JSON.parse(team),
                gameDate,
                opponent,
                gameId,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData?.error || `HTTP error! status: ${response.status}`,
            );
        }

        const formResponse = await response.json();

        // Return a success message or the form response
        return { success: true, formResponse };
    } catch (error) {
        console.error("Error creating attendance:", error);
        return { success: false, error: error.message };
    }
}
