import { modals } from '@mantine/modals';

const useModal = () => {

    const openModal = ({ title, children, ...rest }) => {
        modals.open({
            title,
            children,
            overlayProps: {
                backgroundOpacity: 0.55,
                blur: 3,
            },
            ...rest,
        });
    };

    return { openModal, closeAllModals: modals.closeAll };
};

export default useModal;