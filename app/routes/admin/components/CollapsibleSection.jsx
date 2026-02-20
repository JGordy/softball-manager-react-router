import { useState } from "react";
import { Collapse, Stack, Text } from "@mantine/core";

export const CollapsibleSection = ({ items, renderItem, initialLimit = 5 }) => {
    const [expanded, setExpanded] = useState(false);

    if (!items || items.length === 0) return null;

    const head = items.slice(0, initialLimit);
    const tail = items.slice(initialLimit);

    return (
        <Stack gap="xs">
            {head.map(renderItem)}
            {tail.length > 0 && (
                <>
                    <Collapse in={expanded}>
                        <Stack gap="xs" mt="xs">
                            {tail.map(renderItem)}
                        </Stack>
                    </Collapse>
                    <Text
                        component="button"
                        size="xs"
                        c="dimmed"
                        ta="center"
                        fw={700}
                        style={{
                            cursor: "pointer",
                            border: "none",
                            background: "none",
                            width: "100%",
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            setExpanded(!expanded);
                        }}
                        py="xs"
                    >
                        {expanded ? "Show Less" : `See ${tail.length} more...`}
                    </Text>
                </>
            )}
        </Stack>
    );
};
