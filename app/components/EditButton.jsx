import { Button, Group, Text, useComputedColorScheme } from "@mantine/core";

import { IconEdit } from "@tabler/icons-react";

export default function EditButton({ setIsModalOpen }) {
    const computedColorScheme = useComputedColorScheme("light");

    return (
        <Button
            variant="subtle"
            color={computedColorScheme === "light" ? "black" : "white"}
            onClick={() => setIsModalOpen(true)}
            p="0"
            autoContrast
        >
            <Group gap="5px">
                <IconEdit size={18} />
                <Text size="sm">Edit</Text>
            </Group>
        </Button>
    );
}
