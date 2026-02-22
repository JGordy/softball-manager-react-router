import { Paper, Title } from "@mantine/core";
import { CollapsibleSection } from "./CollapsibleSection";

export const DashboardSection = ({
    id,
    title,
    items,
    renderItem,
    initialLimit = 5,
}) => (
    <Paper id={id} withBorder p="md" radius="md">
        <Title order={3} mb="md">
            {title}
        </Title>
        <CollapsibleSection
            items={items}
            initialLimit={initialLimit}
            renderItem={renderItem}
        />
    </Paper>
);
