import { Form, useSubmit, useNavigation } from "react-router";

import { Button, Group } from "@mantine/core";

import useModal from "@/hooks/useModal";

export default function FormWrapper({
    action,
    actionRoute,
    buttonColor,
    children,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmDisabled = false,
    onCancelClick,
    hideButtons,
    onSubmit,
    loading,
    ...rest
}) {
    const { closeAllModals } = useModal();

    const submit = useSubmit();
    const navigation = useNavigation();

    const isSubmitting =
        navigation.state === "submitting" || navigation.state === "loading";
    const isLoading = loading || isSubmitting;

    const handleSubmit = (event) => {
        event.preventDefault();

        if (onSubmit) {
            onSubmit(event);
        }

        const formData = new FormData(event.currentTarget);
        formData.append("_action", action);

        submit(formData, { action: actionRoute, method: "post" });
    };

    return (
        <Form method="post" onSubmit={handleSubmit} {...rest}>
            {children}
            {!hideButtons && (
                <Group position="right" mt="xl" mb="sm">
                    <Button
                        type="submit"
                        color={buttonColor || "lime"}
                        autoContrast
                        size="md"
                        loading={isLoading}
                        disabled={confirmDisabled || isLoading}
                    >
                        {confirmText}
                    </Button>
                    <Button
                        variant="outline"
                        color="gray"
                        onClick={onCancelClick || closeAllModals}
                        size="md"
                    >
                        {cancelText}
                    </Button>
                </Group>
            )}
        </Form>
    );
}
