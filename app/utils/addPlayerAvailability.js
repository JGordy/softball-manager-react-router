export default function addPlayerAvailability(responses, players) {
    return players.map((player) => {
        const response = responses.find((r) => r.playerId === player.$id);
        const availability = response
            ? response.status || "unknown"
            : player.availability || "unknown";
        return { ...player, availability };
    });
}
