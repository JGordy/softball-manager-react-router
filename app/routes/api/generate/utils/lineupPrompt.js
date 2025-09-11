import positions from "@constants/positions";

const prompt = `Available Fielding Positions: ${JSON.stringify(Object.keys(positions))}

** Steps to implement the below rules. This is most important **
Inning #1: For each position find a player that has that position listed in their preferredPositions list. Assign them to that position. Assign the rest of the players as "Out" for that inning.
Inning #2: First look for players assigned "Out" in inning #1 and assign them an available fielding position according to their preferredPositions list. Then look through the remaining players and find positions for them as well. When all positions are full, mark the players not assigned a position as "Out"
Inning #3: First look for players assigned "Out" in inning #2 and assign them an available fielding position according to their preferredPositions list. Then look through the remaining players and find positions for them as well. When all positions are full, mark the players not assigned a position as "Out"
Inning #4: First look for players assigned "Out" in inning #3 and assign them an available fielding position according to their preferredPositions list. Then look through the remaining players and find positions for them as well. When all positions are full, mark the players not assigned a position as "Out"
Inning #5: First look for players assigned "Out" in inning #4 and assign them an available fielding position according to their preferredPositions list. Then look through the remaining players and find positions for them as well. When all positions are full, mark the players not assigned a position as "Out"
Inning #6: First look for players assigned "Out" in inning #5 and assign them an available fielding position according to their preferredPositions list. Then look through the remaining players and find positions for them as well. When all positions are full, mark the players not assigned a position as "Out"
Inning #7: First look for players assigned "Out" in inning #6 and assign them an available fielding position according to their preferredPositions list. Then look through the remaining players and find positions for them as well. When all positions are full, mark the players not assigned a position as "Out"

Rules:

** Batting Order:

Gender Balance: No more than two male players can bat consecutively. A female player must be every third batter in the lineup.
No Skill Ratings: Do not consider player skill ratings (e.g., "battingRating", "fieldRating") when determining the batting order.
Reorder the JSON data: The provided player array must be reordered to reflect the final batting order. The length of the array should remain unchanged.
** Fielding Chart:

Unique Positions: Only one player can occupy a specific fielding position (e.g., Left Field, Right Field, etc.) in any given inning.
Position Coverage: All 10 fielding positions MUST be filled in each inning if there are 10 or more players. If there are fewer than 10 players, all available players must be assigned to a fielding position.
"Out" Status:
"Out" is a special non-fielding assignment.
A player can be assigned "Out" a maximum of **two times** throughout the entire game (across all innings).
If a player is assigned "Out" in one inning, they must be assigned to a fielding position in the following inning.
Position Preference:
Players should be assigned to positions within their "preferredPositions" list whenever possible, without violating other rules.
If a player cannot be assigned a preferred position, assign them to the next available position that adheres to all rules.
"Out" Assignment Minimization:
In each inning, prioritize assigning a valid position to players who were assigned "Out" in the previous inning. This helps distribute "Out" assignments more evenly across players.
Each player should be assigned "Out" at least once to allow fair rotation of fielding positions for other players. As long as the other rules are met.
`;

export default prompt;
