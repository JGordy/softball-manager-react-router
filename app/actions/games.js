import { ID, Permission, Role } from "node-appwrite";

import {
    createDocument,
    deleteDocument,
    readDocument,
    updateDocument,
} from "@/utils/databases.js";
import { combineDateTime } from "@/utils/dateTime";
import { hasBadWords } from "@/utils/badWordsApi";
import { getNotifiableTeamMembers } from "@/utils/teams.js";

import { findOrCreatePark } from "@/actions/parks";

import { getTeamMembers } from "@/utils/teams.js";
import {
    createAdminClient,
    createSessionClient,
} from "@/utils/appwrite/server";

import { removeEmptyValues } from "./utils/formUtils";

import { updatePlayerAttendance } from "./attendance";
import {
    sendGameFinalNotification,
    sendAwardVoteNotification,
} from "./notifications";

function computeResult(score, opponentScore) {
    const a = parseInt(String(score).trim(), 10);
    const b = parseInt(String(opponentScore).trim(), 10);

    if (Number.isNaN(a) || Number.isNaN(b)) return undefined;

    if (a > b) return "won";
    if (a < b) return "lost";
    return "tie";
}

/**
 * Initializes attendance records for a game based on user default availability preferences.
 */
async function initializeDefaultAttendance(gameId, teamId) {
    if (!teamId) return;

    try {
        const { users } = createAdminClient();
        const memberships = await getTeamMembers({ teamId });

        const memberUserIds = memberships.memberships
            .filter((m) => m.userId)
            .map((m) => m.userId);

        // Fetch all user preferences in parallel
        const prefsResults = await Promise.allSettled(
            memberUserIds.map((userId) =>
                users.getPrefs({ userId }).then((prefs) => ({ userId, prefs })),
            ),
        );

        const attendanceUpdates = [];

        for (const result of prefsResults) {
            if (result.status === "fulfilled") {
                const { userId, prefs } = result.value;
                let defaultAvailability = prefs?.defaultAvailability || {};

                if (typeof defaultAvailability === "string") {
                    try {
                        defaultAvailability = JSON.parse(defaultAvailability);
                    } catch (e) {
                        defaultAvailability = {};
                    }
                }

                if (defaultAvailability[teamId] === "accepted") {
                    attendanceUpdates.push(
                        updatePlayerAttendance({
                            values: {
                                playerId: userId,
                                status: "accepted",
                                teamId,
                                updatedBy: "system-default",
                            },
                            eventId: gameId,
                        }),
                    );
                }
            } else {
                console.warn(
                    "Failed to fetch preferences for a user during attendance initialization:",
                    result.reason,
                );
            }
        }

        // Wait for all attendance updates (started above) to complete
        if (attendanceUpdates.length > 0) {
            await Promise.all(attendanceUpdates);
        }
    } catch (error) {
        console.error("Error in initializeDefaultAttendance:", error);
    }
}

export async function createSingleGame({ values, teamId: passedTeamId }) {
    const {
        gameDate,
        gameTime,
        isHomeGame,
        opponent,
        teamId: valuesTeamId,
        locationDetails,
        eventType,
        ...gameData
    } = values;

    const teamId = passedTeamId || valuesTeamId;

    let parsedLocationDetails = null;
    try {
        parsedLocationDetails = locationDetails
            ? JSON.parse(locationDetails)
            : null;
    } catch (e) {
        console.error("Error parsing locationDetails:", e);
    }

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

        let parkId = null;
        let location = gameData.location || null;

        if (parsedLocationDetails?.placeId) {
            const parkResponse = await findOrCreatePark({
                values: parsedLocationDetails,
                placeId: parsedLocationDetails.placeId,
            });

            if (parkResponse) {
                parkId = parkResponse.$id;
            }
        }

        // If location matches season location, don't persist it at the game level
        if (values.seasonId && location) {
            try {
                const season = await readDocument("seasons", values.seasonId);
                if (season?.location === location) {
                    location = null;
                    parkId = null;
                }
            } catch (e) {
                console.error("Error fetching season for location check:", e);
            }
        }

        // Build permissions array if we have teamId
        const permissions = teamId
            ? [
                  Permission.read(Role.team(teamId)), // Team members can read
                  Permission.update(Role.team(teamId, "manager")), // Managers can update
                  Permission.update(Role.team(teamId, "owner")), // Owners can update
                  Permission.update(Role.team(teamId, "scorekeeper")), // Scorekeepers can update
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
            location,
            isHomeGame: isHomeGame === "true",
            gameDate: updatedGameDate,
            opponent,
            teamId,
            parkId,
            eventType: eventType || "game",
            seasonId: values.seasonId,
            seasons: values.seasonId,
        };

        const createdGame = await createDocument(
            "games",
            ID.unique(),
            updatedGameData,
            permissions,
        );

        // Initialize attendance based on user defaults
        await initializeDefaultAttendance(createdGame.$id, teamId);

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
                  Permission.update(Role.team(teamId, "scorekeeper")), // Scorekeepers can update
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

        // Initialize attendance for all created games in parallel
        if (teamId) {
            await Promise.all(
                createdGames.map((createdGame) =>
                    initializeDefaultAttendance(createdGame.$id, teamId),
                ),
            );
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
    const { opponent, locationDetails } = values;

    // Removes undefined or empty string values from data to update
    let dataToUpdate = removeEmptyValues({ values });

    // Handle location clearing or updating
    if (Object.prototype.hasOwnProperty.call(values, "location")) {
        if (values.location === "") {
            dataToUpdate.location = null;
            dataToUpdate.parkId = null;
        } else {
            // Clear parkId for manual edits; it will be re-set if locationDetails are valid
            dataToUpdate.parkId = null;

            if (locationDetails) {
                try {
                    const parsedLocationDetails = JSON.parse(locationDetails);
                    if (parsedLocationDetails?.placeId) {
                        const parkResponse = await findOrCreatePark({
                            values: parsedLocationDetails,
                            placeId: parsedLocationDetails.placeId,
                        });

                        if (parkResponse?.$id) {
                            dataToUpdate.parkId = parkResponse.$id;
                        }
                    }
                } catch (e) {
                    console.error("Error parsing locationDetails:", e);
                }
            }

            // If location matches season location, don't persist it at the game level
            if (values.seasonId) {
                try {
                    const season = await readDocument(
                        "seasons",
                        values.seasonId,
                    );
                    if (season?.location === values.location) {
                        dataToUpdate.location = null;
                        dataToUpdate.parkId = null;
                    }
                } catch (e) {
                    console.error(
                        "Error fetching season for location check:",
                        e,
                    );
                }
            }
        }
    }

    // Handle location notes clearing
    if (Object.prototype.hasOwnProperty.call(values, "locationNotes")) {
        if (values.locationNotes === "") {
            dataToUpdate.locationNotes = null;
        }
    }

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

        dataToUpdate.result = computeResult(
            dataToUpdate.score,
            dataToUpdate.opponentScore,
        );
    }

    delete dataToUpdate.gameTime;
    delete dataToUpdate.locationDetails;

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
                            gameDetails.score,
                            gameDetails.opponentScore,
                        );

                        const scoreDisplay = `${result} ${
                            gameDetails.score || 0
                        } - ${gameDetails.opponentScore || 0}`;

                        await sendGameFinalNotification({
                            gameId: eventId,
                            teamId,
                            userIds,
                            opponent: gameDetails.opponent || "Opponent",
                            score: scoreDisplay,
                        });

                        // Send award vote reminder after 5.5 seconds
                        setTimeout(() => {
                            sendAwardVoteNotification({
                                gameId: eventId,
                                teamId,
                                userIds,
                                opponent: gameDetails.opponent || "Opponent",
                            }).catch((err) =>
                                console.error(
                                    "Error sending award vote notification:",
                                    err,
                                ),
                            );
                        }, 5500);
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
            event:
                isSetFinal || scoresProvided
                    ? {
                          name: "game-scored",
                          data: { eventId, teamId: gameDetails.teamId },
                      }
                    : undefined,
        };
    } catch (error) {
        console.error("Error updating game:", error);
        throw error;
    }
}

export async function deleteGame({ eventId, request }) {
    try {
        if (!request) {
            throw new Error("Request object is required for authorization.");
        }

        const sessionClient = await createSessionClient(request);

        // Appwrite row-level security handles manager/owner validation
        await deleteDocument("games", eventId, sessionClient);

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

export async function deleteGames({ values, request }) {
    const { gameIds } = values;
    let ids = [];
    try {
        ids = typeof gameIds === "string" ? JSON.parse(gameIds) : gameIds;
        if (!Array.isArray(ids) || ids.length === 0) {
            return {
                success: false,
                status: 400,
                message: "No valid game IDs provided",
            };
        }
    } catch (e) {
        console.error("Error parsing gameIds:", e);
        return {
            success: false,
            status: 400,
            message: "Invalid game IDs format",
        };
    }

    let errors = [];

    try {
        if (!request) {
            throw new Error("Request object is required for authorization.");
        }

        const sessionClient = await createSessionClient(request);

        const batchSize = 5;
        let deletedCount = 0;

        for (let i = 0; i < ids.length; i += batchSize) {
            const batch = ids.slice(i, i + batchSize);
            const results = await Promise.allSettled(
                batch.map((id) => deleteDocument("games", id, sessionClient)),
            );

            results.forEach((result) => {
                if (result.status === "fulfilled") {
                    deletedCount++;
                } else {
                    errors.push(result.reason);
                }
            });
        }

        if (errors.length > 0) {
            console.error("Errors encountered while deleting games:", errors);
            return {
                success: deletedCount > 0,
                status: deletedCount > 0 ? 207 : 500,
                message: `${deletedCount} games deleted, ${errors.length} failed.`,
                deleted: deletedCount > 0,
            };
        }

        return {
            success: true,
            status: 200,
            message: `${deletedCount} games deleted successfully!`,
            deleted: true,
        };
    } catch (error) {
        console.error("Error deleting games:", error);
        console.log("Errors array:", errors);
        throw error;
    }
}
