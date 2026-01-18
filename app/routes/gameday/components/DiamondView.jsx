import { Box, Card, Text } from "@mantine/core";

export default function DiamondView({ runners, withTitle = true }) {
    return (
        <>
            {withTitle && (
                <Text size="xs" fw={700} c="dimmed" mb={-5}>
                    ON BASE
                </Text>
            )}
            <Card
                withBorder
                radius="lg"
                style={{
                    position: "relative",
                    height: 180,
                    width: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {/* The Diamond Path */}
                <Box
                    style={{
                        width: 100,
                        height: 100,
                        border: "2px solid var(--mantine-color-gray-3)",
                        transform: "rotate(45deg)",
                        position: "absolute",
                    }}
                />

                {/* Bases */}
                <Base
                    active={runners.first}
                    style={{
                        top: "50%",
                        right: 10,
                        transform: "translateY(-50%) rotate(45deg)",
                    }}
                />
                <Base
                    active={runners.second}
                    style={{
                        top: 10,
                        left: "50%",
                        transform: "translateX(-50%) rotate(45deg)",
                    }}
                />
                <Base
                    active={runners.third}
                    style={{
                        top: "50%",
                        left: 10,
                        transform: "translateY(-50%) rotate(45deg)",
                    }}
                />
                <HomePlate
                    style={{
                        bottom: 10,
                        left: "50%",
                        transform: "translateX(-50%)",
                    }}
                />
            </Card>
        </>
    );
}

function Base({ active, style }) {
    return (
        <Box
            style={{
                width: 24,
                height: 24,
                backgroundColor: active
                    ? "var(--mantine-color-blue-filled)"
                    : "white",
                border:
                    "2px solid " +
                    (active
                        ? "var(--mantine-color-blue-8)"
                        : "var(--mantine-color-gray-4)"),
                position: "absolute",
                zIndex: 2,
                ...style,
            }}
        />
    );
}

function HomePlate({ style }) {
    return (
        <Box
            style={{
                width: 24,
                height: 24,
                position: "absolute",
                zIndex: 2,
                ...style,
            }}
        >
            <svg
                viewBox="0 0 24 24"
                style={{ display: "block" }}
                aria-label="Home plate"
            >
                <path
                    d="M1,1 L23,1 L23,12 L12,23 L1,12 Z"
                    fill="white"
                    stroke="var(--mantine-color-gray-4)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
            </svg>
        </Box>
    );
}
