import { useCallback } from "react";
import { modals } from "@mantine/modals";

const useModal = () => {
    const openModal = useCallback(({ title, children, ...rest }) => {
        return modals.open({
            title,
            radius: "lg",
            children,
            overlayProps: {
                backgroundOpacity: 0.55,
                blur: 3,
            },
            ...rest,
        });
    }, []);

    const updateModal = useCallback((id, { title, children, ...rest }) => {
        modals.updateModal(id, {
            title,
            children,
            overlayProps: {
                backgroundOpacity: 0.55,
                blur: 3,
            },
            ...rest,
        });
    }, []);

    return { openModal, closeAllModals: modals.closeAll, updateModal };
};

export default useModal;
