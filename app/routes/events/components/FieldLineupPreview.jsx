import { Image } from "@mantine/core";
import images from "@/constants/images";
import fieldingPositions from "@/constants/positions";
import styles from "./FieldLineupPreview.module.css";

/**
 * FieldLineupPreview Component
 * Renders the softball field diagram and overlays the first names of active players
 * at their respective positions for Inning 1 of the game.
 *
 * @param {Object} props - Component props.
 * @param {Array} props.playerChart - The parsed and enriched player chart lineup data.
 * @returns {React.ReactElement|null} The field lineup preview overlay or null if no chart data.
 */
export default function FieldLineupPreview({ playerChart }) {
    if (
        !playerChart ||
        !Array.isArray(playerChart) ||
        playerChart.length === 0
    ) {
        return null;
    }

    // Map active players for Inning 1 (positions[0]) to their positions
    const activePlayers = [];
    playerChart.forEach((player) => {
        const position = player.positions?.[0];
        if (position && position !== "Out" && fieldingPositions[position]) {
            activePlayers.push({
                firstName: player.firstName || "",
                positionKey: position,
                positionMeta: fieldingPositions[position],
                playerId: player.$id || player.playerId,
            });
        }
    });

    return (
        <div className={styles.container} data-testid="field-lineup-preview">
            <Image
                src={images.fieldSrc}
                alt="Softball infield diagram showing player positions"
                className={styles.fieldImage}
            />
            {activePlayers.map(
                ({ firstName, positionMeta, positionKey, playerId }) => {
                    const { x, y, initials } = positionMeta;
                    return (
                        <div
                            key={`${playerId}-${positionKey}`}
                            className={styles.positionOverlay}
                            style={{
                                left: `${x}%`,
                                top: `${y}%`,
                            }}
                        >
                            <div className={styles.initialsBadge}>
                                {initials}
                            </div>
                            <div className={styles.playerName}>{firstName}</div>
                        </div>
                    );
                },
            )}
        </div>
    );
}
