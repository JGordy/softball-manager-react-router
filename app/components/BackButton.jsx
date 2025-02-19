import { useNavigate } from "react-router";
import { Button } from '@mantine/core';

import { IconChevronLeft } from '@tabler/icons-react';

export default function BackButton({ text = 'Go Back' }) {

    const navigate = useNavigate();

    const goBack = () => navigate(-1);

    return (
        <Button
            p="0"
            variant="subtle"
            onClick={goBack}
        >
            <IconChevronLeft />
            {text}
        </Button>
    );
};