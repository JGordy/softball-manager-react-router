import { ID, Permission, Role } from "node-appwrite";
import {
    createDocument,
    deleteDocument,
    updateDocument,
} from "@/utils/databases.js";
import { combineDateTime } from "@/utils/dateTime";
import { hasBadWords } from "@/utils/badWordsApi";
import { getNotifiableTeamMembers } from "@/utils/teams.js";

import { removeEmptyValues } from "./utils/formUtils";
import { sendGameFinalNotification } from "./notifications";

function computeResult(score, opponentScore) {
    const a = parseInt(String(score).trim(), 10);
    const b = parseInt(String(opponentScore).trim(), 10);

    if (Number.isNaN(a) || Number.isNaN(b)) return undefined;

    if (a > b) return "won";
    if (a < b) return "lost";
    return "tie";
}

export async function createSingleGame({ values }) {
    const { gameDate, gameTime, isHomeGame, opponent, teamId, ...gameData } =
        values;

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

        // Build permissions array if we have teamId
        const permissions = teamId
            ? [
                  Permission.read(Role.team(teamId)), // Team members can read
                  Permission.update(Role.team(teamId, "manager")), // Managers can update
                  Permission.update(Role.team(teamId, "owner")), // Owners can update
                  Permission.delete(Role.team(teamId, "manager")), // Managers can delete
                  Permission.delete(Role.team(teamId, "owner")), // Owners can delete
              ]
            : [];

        const updatedGameDate = combineDateTime(
            gameDate,
            gameTime,
            values.timeZone,
        );

        const updatedGameData = {
            ...gameData,
            isHomeGame: isHomeGame === "true",
            gameDate: updatedGameDate,
            opponent,
            teamId,
            seasonId: values.seasonId,
            seasons: values.seasonId,
        };

        const createdGame = await createDocument(
            "games",
            ID.unique(),
            updatedGameData,
            permissions,
        );

        return {
            response: { game: createdGame },
            status: 201,
            success: true,
            message: "Game created successfully!",
            event: {
                name: "game-created",
                data: {
                    gameId: createdGame.$id,
                },
            },
        };
    } catch (error) {
        console.error("Error creating game:", error);
        throw error;
    }
}

export async function createGames({ values }) {
    const { games: generatedGames, timeZone } = values;
    let games = JSON.parse(generatedGames);

    // Get teamId from the first game (all games have the same teamId)
    const teamId = games[0]?.teamId;

    try {
        // Build permissions array if we have teamId
        const permissions = teamId
            ? [
                  Permission.read(Role.team(teamId)), // Team members can read
                  Permission.update(Role.team(teamId, "manager")), // Managers can update
                  Permission.update(Role.team(teamId, "owner")), // Owners can update
                  Permission.delete(Role.team(teamId, "manager")), // Managers can delete
                  Permission.delete(Role.team(teamId, "owner")), // Owners can delete
              ]
            : [];

        const createdGames = [];

        for (const game of games) {
            const createdGame = await createDocument(
                "games",
                ID.unique(),
                {
                    ...game,
                    teamId,
                    timeZone,
                    // Ensure both seasonId and seasons are set
                    seasonId: game.seasonId || game.seasons,
                    seasons: game.seasons || game.seasonId,
                },
                permissions,
            );
            createdGames.push(createdGame);
        }

        return {
            response: { games: createdGames },
            status: 201,
            success: true,
            message: `${createdGames.length} games created successfully!`,
            event: {
                name: "games-generated",
                data: {
                    teamId,
                },
            },
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

    // Normalize Boolean flags when provided from forms or API
    if (Object.prototype.hasOwnProperty.call(values, "countTowardsRecord")) {
        dataToUpdate.countTowardsRecord =
            values.countTowardsRecord === "true" ||
            values.countTowardsRecord === "on" ||
            values.countTowardsRecord === true;
    }

    if (Object.prototype.hasOwnProperty.call(values, "gameFinal")) {
        dataToUpdate.gameFinal =
            values.gameFinal === "true" ||
            values.gameFinal === "on" ||
            values.gameFinal === true;
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

        // Send notification if game is finalized or score is updated
        const isSetFinal = dataToUpdate.gameFinal === true;
        const scoresProvided =
            dataToUpdate.hasOwnProperty("score") &&
            dataToUpdate.hasOwnProperty("opponentScore");

        if (isSetFinal || scoresProvided) {
            try {
                // Get team members to notify
                const teamId = gameDetails.teamId;

                if (teamId) {
                    const userIds = await getNotifiableTeamMembers(teamId);

                    if (userIds.length > 0) {
                        const result = computeResult(
                            dataToUpdate.score,
                            dataToUpdate.opponentScore,
                        );

                        const resultDisplay = result
                            ? result.charAt(0).toUpperCase() +
                              result.slice(1) +
                              " "
                            : "";

                        const scoreDisplay = `${resultDisplay}${
                            gameDetails.score || 0
                        } - ${gameDetails.opponentScore || 0}`;

                        await sendGameFinalNotification({
                            gameId: eventId,
                            teamId,
                            userIds,
                            opponent: gameDetails.opponent || "Opponent",
                            score: scoreDisplay,
                        });
                    }
                }
            } catch (notifyError) {
                console.error(
                    "Error sending game final notification:",
                    notifyError,
                );
            }
        }

        return {
            response: { gameDetails },
            status: 204,
            success: true,
            message: "Game updated successfully!",
        };
    } catch (error) {
        console.error("Error updating game:", error);
        throw error;
    }
}

export async function deleteGame({ values, eventId }) {
    // TODO: Add permission check here with values.userId
    try {
        await deleteDocument("games", eventId);

        return {
            success: true,
            status: 200,
            message: "Game deleted successfully!",
            deleted: true,
        };
    } catch (error) {
        console.error("Error deleting game:", error);
        throw error;
    }
}
