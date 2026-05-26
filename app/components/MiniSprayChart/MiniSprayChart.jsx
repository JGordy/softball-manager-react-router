import { useMemo } from "react";
import { Box, Card, Image, Tooltip } from "@mantine/core";
import images from "@/constants/images";
import { ORIGIN_X, ORIGIN_Y } from "@/constants/fieldMapping";
import { EVENT_TYPE_MAP, getUILabel, RESULT_COLORS } from "@/constants/scoring";

// We reuse the CSS from ContactSprayChart to ensure identical layout constraints
import styles from "../ContactSprayChart/ContactSprayChart.module.css";

/**
 * A lightweight, read-only spray chart used for quick pattern recognition.
 * Designed to be embedded in small cards (like CurrentBatterCard) without filters.
 */
export default function MiniSprayChart({ hits = [] }) {
    const plottedHits = useMemo(() => {
        return hits
            .map((hit) => {
                const eventType = hit.eventType || hit.result;
                const normalizedKey = EVENT_TYPE_MAP[eventType] || eventType;
                const color = RESULT_COLORS[normalizedKey] || RESULT_COLORS.out;
                const label = getUILabel(normalizedKey);
                return { ...hit, normalizedKey, color, label };
            })
            .filter((hit) => hit.hitX != null && hit.hitY != null);
    }, [hits]);

    if (plottedHits.length === 0) return null;

    return (
        <Card className={styles.mapContainer} radius="md" p="0px" withBorder>
            <Image
                src={images.fieldSrc}
                alt="Softball Field"
                className={styles.mapImage}
                draggable={false}
            />

            <svg className={styles.svgOverlay} viewBox="0 0 100 100">
                {plottedHits.map((hit, index) => {
                    const startX = ORIGIN_X;
                    const startY = ORIGIN_Y;
                    const endX = hit.hitX;
                    const endY = hit.hitY;
                    const midX = (startX + endX) / 2;
                    const midY = (startY + endY) / 2;
                    const dx = endX - startX;
                    const dy = endY - startY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const arcHeight = dist * 0.2;
                    const cpX = midX;
                    const cpY = midY - arcHeight;

                    // Highlight the most recent hit (assuming chronological sorting)
                    const isLast = index === plottedHits.length - 1;

                    return (
                        <path
                            key={`path-${hit.$id}`}
                            d={`M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`}
                            fill="none"
                            stroke={hit.color}
                            strokeWidth={isLast ? "1.5" : "0.5"}
                            opacity={isLast ? "1" : "0.5"}
                            strokeLinecap="round"
                        />
                    );
                })}
            </svg>

            {plottedHits.map((hit, index) => {
                const location = hit.hitLocation || hit.direction;
                const isLast = index === plottedHits.length - 1;
                return (
                    <Tooltip
                        key={hit.$id}
                        label={
                            location ? `${hit.label} (${location})` : hit.label
                        }
                        withArrow
                    >
                        <Box
                            className={styles.hitMarker}
                            style={{
                                left: `${hit.hitX}%`,
                                top: `${hit.hitY}%`,
                                backgroundColor: hit.color,
                                borderColor: "white",
                                transform: isLast
                                    ? "translate(-50%, -50%) scale(1.5)"
                                    : "translate(-50%, -50%) scale(0.8)",
                                opacity: isLast ? 1 : 0.6,
                                zIndex: isLast ? 10 : 1,
                            }}
                        />
                    </Tooltip>
                );
            })}
        </Card>
    );
}
