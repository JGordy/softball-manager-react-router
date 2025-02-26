import { Form, useSubmit } from 'react-router';

import { Button, Group } from '@mantine/core';
import { modals } from '@mantine/modals';

export default function FormWrapper({
    action,
    actionRoute,
    buttonColor,
    children,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
}) {

    const submit = useSubmit();

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.append("_action", action);

        submit(formData, { action: actionRoute, method: 'post' });
    };

    return (
        <Form
            method="post"
            onSubmit={handleSubmit}
        >
            {children}
            <Group position="right" mt="lg">
                <Button
                    type="submit"
                    color={buttonColor || 'green'}
                    autoContrast
                >
                    {confirmText}
                </Button>
                <Button
                    variant="outline"
                    color="gray"
                    onClick={() => {
                        modals.closeAll();
                        // setError(null);
                    }}
                >
                    {cancelText}
                </Button>
            </Group>
        </Form>
    );
};