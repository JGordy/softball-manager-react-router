import { useNavigate } from "react-router";
import { Anchor, Group, useComputedColorScheme } from "@mantine/core";

import { IconChevronLeft } from "@tabler/icons-react";

export default function BackButton({ text = "Go Back", to }) {
    const computedColorScheme = useComputedColorScheme("light");

    const navigate = useNavigate();

    const goBack = () => navigate(to || -1);

    return (
        <Anchor p="0" c={computedColorScheme === "light" ? "black" : "white"} onClick={goBack} component="button">
            <Group gap="0px">
                <IconChevronLeft />
                {text}
            </Group>
        </Anchor>
    );
}
