module.exports = async function ({ req, res, log }) {
    const { teamIds } = req.body; // Get the teamIds from the request body
    const { databases } = req.variables; // Get the databases client

    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
        return res.json({ teams: [] }); // Return empty array if no teamIds provided
    }

    try {
        const promises = teamIds.map(async (teamId) => {
            return databases.listDocuments('main', 'teams', [
                Query.equal('$id', teamId), // Assuming $id is indexed
                Query.orderDesc("$updatedAt")
            ]);
        });

        const results = await Promise.all(promises);
        const teams = results.flatMap(result => result.documents); // Use flatMap for cleaner flattening

        return res.json({ teams });
    } catch (error) {
        log(error);
        return res.json({ error: error.message }, 500); // Return error with appropriate status code
    }
};